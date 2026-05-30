const { queryLogs, semanticSearch, getIpReputation, suggestRemediation } = require('./tools');
const { createGoogleGenAI } = require('./genaiClient');
require('dotenv').config({ quiet: true });

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let ai;

function getAi() {
  if (!ai) {
    ai = createGoogleGenAI();
  }

  return ai;
}

const toolDefinitions = [
  {
    name: 'query_logs',
    description: 'Query security logs by severity level or event type. Use this to find specific types of security events.',
    parameters: {
      type: 'object',
      properties: {
        severity: { type: 'string', description: 'Filter by severity: low, medium, high, or critical' },
        event_type: { type: 'string', description: 'Filter by event type: auth_failure, port_scan, privilege_escalation, malware_detected, data_exfiltration, anomalous_access' },
        limit: { type: 'number', description: 'Maximum number of results to return' }
      }
    }
  },
  {
    name: 'semantic_search',
    description: 'Search security logs using natural language. Use this when the user describes a threat in their own words.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Natural language description of the threat to search for' }
      },
      required: ['question']
    }
  },
  {
    name: 'get_ip_reputation',
    description: 'Get the risk score and full event history for a specific IP address.',
    parameters: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'The IP address to look up' }
      },
      required: ['ip']
    }
  },
  {
    name: 'suggest_remediation',
    description: 'Get remediation steps for a specific type of security event.',
    parameters: {
      type: 'object',
      properties: {
        event_type: { type: 'string', description: 'The type of security event to get remediation for' }
      },
      required: ['event_type']
    }
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableAiError(error) {
  return error?.status === 429 || error?.status === 500 || error?.status === 503;
}

function isAiUnavailable(error) {
  const message = error?.message || '';
  return isRetryableAiError(error)
    || error?.status === 401
    || error?.status === 403
    || /api key|permission_denied|credentials|leaked/i.test(message);
}

async function generateContentWithRetry(request, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await getAi().models.generateContent(request);
    } catch (error) {
      if (!isRetryableAiError(error) || attempt === retries) {
        throw error;
      }

      const delayMs = 1000 * 2 ** attempt;
      console.warn(`Gemini request failed with ${error.status}. Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
}

function pickFallbackTool(userMessage) {
  const text = userMessage.toLowerCase();

  if (text.includes('brute force') || text.includes('failed login') || text.includes('auth failure')) {
    return { name: 'suggest_remediation', args: { event_type: 'auth_failure' } };
  }

  if (text.includes('critical') || text.includes('most severe') || text.includes('highest severity')) {
    return { name: 'query_logs', args: { severity: 'critical', limit: 5 } };
  }

  const ipMatch = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipMatch) {
    return { name: 'get_ip_reputation', args: { ip: ipMatch[0] } };
  }

  return { name: 'semantic_search', args: { question: userMessage } };
}

function summarizeLog(log) {
  const bits = [
    `${log.severity || 'unknown'} ${log.event_type || 'event'}`,
    log.ip ? `from ${log.ip}` : null,
    log.user ? `user ${log.user}` : null,
    log.details ? `- ${log.details}` : null
  ].filter(Boolean);

  return bits.join(' ');
}

function formatToolFallback(toolName, toolResult) {
  if (toolName === 'query_logs' || toolName === 'semantic_search') {
    const logs = Array.isArray(toolResult) ? toolResult : [];
    if (logs.length === 0) {
      return 'I checked the logs, but did not find matching events. Next step: broaden the search criteria or review recent ingestion status.';
    }

    const lines = logs.map((log, index) => `${index + 1}. ${summarizeLog(log)}`);
    return [
      'I found these security events from the logs:',
      ...lines,
      'Next steps: prioritize containment for critical/high events, block suspicious IPs where appropriate, and review affected users/systems for follow-on activity.'
    ].join('\n');
  }

  if (toolName === 'get_ip_reputation') {
    const events = Array.isArray(toolResult.events) ? toolResult.events : [];
    const lines = events.slice(0, 5).map((log, index) => `${index + 1}. ${summarizeLog(log)}`);

    return [
      `IP ${toolResult.ip} is rated ${toolResult.risk || toolResult.status || 'unknown'} with ${toolResult.total_events || events.length || 0} related event(s).`,
      ...lines,
      'Next steps: block or monitor the IP based on risk, then investigate associated accounts and systems.'
    ].join('\n');
  }

  if (toolName === 'suggest_remediation') {
    const steps = Array.isArray(toolResult.steps) ? toolResult.steps : [];
    return [
      `Recommended remediation for ${toolResult.event_type || 'this event'}:`,
      ...steps.map((step, index) => `${index + 1}. ${step}`)
    ].join('\n');
  }

  return `Tool result:\n${JSON.stringify(toolResult, null, 2)}`;
}

async function runTool(name, args) {
  switch (name) {
    case 'query_logs': return await queryLogs(args);
    case 'semantic_search': return await semanticSearch(args.question);
    case 'get_ip_reputation': return await getIpReputation(args.ip);
    case 'suggest_remediation': return await suggestRemediation(args.event_type);
    default: return { error: 'Unknown tool' };
  }
}

async function chat(userMessage, history = []) {
  const messages = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  let response;

  try {
    response = await generateContentWithRetry({
      model: MODEL,
      contents: messages,
      config: {
        systemInstruction: `You are ThreatLens, an expert AI security analyst.
        You have access to a MongoDB database of security logs.
        Always use your tools to fetch real data before answering.
        Be concise, precise and actionable in your responses.
        When you find threats, always suggest next steps.`,
        tools: [{ functionDeclarations: toolDefinitions }]
      }
    });
  } catch (error) {
    if (!isAiUnavailable(error)) {
      const fallbackTool = pickFallbackTool(userMessage);

      if (fallbackTool.name !== 'semantic_search') {
        console.warn(`Gemini is unavailable. Falling back to ${fallbackTool.name}: ${error.message}`);
        const toolResult = await runTool(fallbackTool.name, fallbackTool.args);

        return {
          text: formatToolFallback(fallbackTool.name, toolResult),
          toolUsed: fallbackTool.name,
          toolResult
        };
      }

      throw error;
    }

    const fallbackTool = pickFallbackTool(userMessage);
    console.warn(`Gemini is unavailable (${error.status || error.message}). Falling back to ${fallbackTool.name}.`);
    const toolResult = await runTool(fallbackTool.name, fallbackTool.args);

    return {
      text: formatToolFallback(fallbackTool.name, toolResult),
      toolUsed: fallbackTool.name,
      toolResult
    };
  }

  const candidate = response.candidates?.[0]?.content;

  if (!candidate?.parts?.length) {
    return {
      text: response.text || 'No response was returned by the model.',
      toolUsed: null,
      toolResult: null
    };
  }
  
  // Handle tool calls
  if (candidate.parts.some(p => p.functionCall)) {
    const toolCall = candidate.parts.find(p => p.functionCall);
    const toolName = toolCall.functionCall.name;
    const toolArgs = toolCall.functionCall.args;
    
    console.log(`Calling tool: ${toolName}`, toolArgs);
    const toolResult = await runTool(toolName, toolArgs);

    // Send tool result back to model
    let finalResponse;

    try {
      finalResponse = await generateContentWithRetry({
        model: MODEL,
        contents: [
          ...messages,
          { role: 'model', parts: candidate.parts },
          { role: 'user', parts: [{ functionResponse: { name: toolName, response: { result: JSON.stringify(toolResult) } } }] }
        ],
        config: {
          systemInstruction: `You are ThreatLens, an expert AI security analyst.
          Be concise, precise and actionable in your responses.`,
          tools: [{ functionDeclarations: toolDefinitions }]
        }
      });
    } catch (error) {
      if (!isAiUnavailable(error)) {
        throw error;
      }

      console.warn(`Gemini summary failed with ${error.status || error.message}. Returning a local summary from tool data.`);

      return {
        text: formatToolFallback(toolName, toolResult),
        toolUsed: toolName,
        toolResult
      };
    }

    return {
      text: finalResponse.text || finalResponse.candidates?.[0]?.content?.parts?.[0]?.text || '',
      toolUsed: toolName,
      toolResult
    };
  }

  return {
    text: candidate.parts[0].text,
    toolUsed: null,
    toolResult: null
  };
}

module.exports = { chat };
