// === Configuration ===
// Google Gemini API — FREE tier, no credit card required
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are an expert AI prompt engineer and tool advisor. Your job is to help professionals get the best results from AI tools.

The user will provide:
1. Their professional position/role
2. A description of the task or problem they need help with

You must respond with EXACTLY two sections, using the markers shown below. Do not include any text outside these two sections.

===PROMPT_START===
Write a detailed, ready-to-use prompt that the user can copy and paste directly into a FREE AI tool. The prompt should:
- Be written in the first person from the user's perspective (e.g., "I am a software engineer working on...")
- Include relevant context about their professional role and domain expertise level
- Be specific and structured (use numbered steps, bullet points, or clear sections as appropriate)
- Include instructions for the AI on the desired output format
- Be between 100-300 words
- NOT include any meta-commentary -- just the actual prompt text they would paste
- Be optimized for free-tier AI tools (avoid requesting features only available in paid tiers, like file uploads over free limits, plugins, or advanced tools)
===PROMPT_END===

===TOOL_START===
IMPORTANT: Only recommend tools that are available for FREE (no paid subscription required). Recommend the single best free AI/ML tool for this specific task from the following list:
- Claude Free (claude.ai) -- free tier, best for nuanced analysis, long documents, coding, writing, reasoning
- ChatGPT Free (chatgpt.com) -- free tier, best for general tasks, conversation, broad knowledge
- Gemini Free (gemini.google.com) -- free tier, best for Google ecosystem integration, multimodal with web access
- Perplexity Free (perplexity.ai) -- free tier, best for research tasks requiring cited sources and real-time web information
- NotebookLM (notebooklm.google.com) -- completely free, best for analyzing and synthesizing uploaded documents and sources
- Microsoft Copilot Free (copilot.microsoft.com) -- free tier, best for general tasks with web access and image generation
- Google Colab (colab.research.google.com) -- free tier, best for running Python code, data analysis, and ML experiments
- Hugging Face (huggingface.co) -- free tier, best for accessing open-source ML models and demos
- DALL-E via ChatGPT Free (chatgpt.com) -- limited free image generation integrated with text workflows
- Stable Diffusion via HuggingFace -- free and open-source image generation with maximum control
- Meta AI (meta.ai) -- free, best for casual conversation, creative writing, and image generation

Do NOT recommend any tool that requires a paid subscription (no Midjourney, no GitHub Copilot, no Cursor, no Runway, no ChatGPT Plus features, no Claude Pro features). Only recommend what users can access for free.

Format your response as:
TOOL: [Tool Name] (free)
REASONING: [2-3 sentences explaining why this free tool is the best fit for this specific task, referencing the user's role and the nature of their task. Mention one free alternative tool and why the primary pick is better. Include the URL where the user can access it.]
===TOOL_END===`;

// === DOM References ===
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeySaved = document.getElementById('api-key-saved');
const changeKeyBtn = document.getElementById('change-key-btn');
const positionSelect = document.getElementById('position-select');
const customPosition = document.getElementById('custom-position');
const taskInput = document.getElementById('task-input');
const generateBtn = document.getElementById('generate-btn');
const errorMessage = document.getElementById('error-message');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const generatedPrompt = document.getElementById('generated-prompt');
const copyBtn = document.getElementById('copy-btn');
const toolName = document.getElementById('tool-name');
const toolReasoning = document.getElementById('tool-reasoning');

let apiKeySavedFlag = false;

// === API Key Management ===
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return;
    sessionStorage.setItem('gemini_api_key', key);
    apiKeySavedFlag = true;
    apiKeyForm.classList.add('hidden');
    apiKeySaved.classList.remove('hidden');
    updateGenerateButton();
});

changeKeyBtn.addEventListener('click', () => {
    apiKeySaved.classList.add('hidden');
    apiKeyForm.classList.remove('hidden');
    apiKeyInput.value = '';
    apiKeySavedFlag = false;
    sessionStorage.removeItem('gemini_api_key');
    updateGenerateButton();
});

// Check if key already exists in session
if (sessionStorage.getItem('gemini_api_key')) {
    apiKeySavedFlag = true;
    apiKeyForm.classList.add('hidden');
    apiKeySaved.classList.remove('hidden');
}

// === Position "Other" Toggle ===
positionSelect.addEventListener('change', () => {
    if (positionSelect.value === 'Other') {
        customPosition.classList.remove('hidden');
        customPosition.focus();
    } else {
        customPosition.classList.add('hidden');
        customPosition.value = '';
    }
    updateGenerateButton();
});

customPosition.addEventListener('input', updateGenerateButton);
taskInput.addEventListener('input', updateGenerateButton);

// === Form Validation ===
function getPosition() {
    if (positionSelect.value === 'Other') {
        return customPosition.value.trim();
    }
    return positionSelect.value;
}

function updateGenerateButton() {
    const hasPosition = getPosition() !== '';
    const hasTask = taskInput.value.trim() !== '';
    generateBtn.disabled = !(apiKeySavedFlag && hasPosition && hasTask);
}

// === UI Helpers ===
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}

function showLoading() {
    loadingEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    generateBtn.disabled = true;
}

function hideLoading() {
    loadingEl.classList.add('hidden');
    updateGenerateButton();
}

// === API Call (Google Gemini) ===
async function callAPI(position, task) {
    const apiKey = sessionStorage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('Please enter your Google Gemini API key above before generating.');
    }

    const userMessage = `My position: ${position}\nMy task: ${task}`;
    const apiUrl = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [{
                parts: [{ text: userMessage }]
            }],
            generationConfig: {
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        let msg;
        try {
            const errorData = await response.json();
            msg = errorData.error?.message || '';
        } catch {
            msg = '';
        }

        switch (response.status) {
            case 400:
                throw new Error('Invalid request. Please check your API key and try again. ' + (msg ? '(' + msg + ')' : ''));
            case 403:
                throw new Error('API key is invalid or does not have access. Please double-check you copied the full key from aistudio.google.com/apikey. ' + (msg ? '(' + msg + ')' : ''));
            case 429:
                throw new Error('Rate limit reached. Google\'s free tier has daily limits. Please wait a minute and try again, or try again tomorrow if the daily limit was reached. ' + (msg ? '(' + msg + ')' : ''));
            default:
                throw new Error(msg || `API error: ${response.status}`);
        }
    }

    const data = await response.json();

    // Extract text from Gemini response format
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Received an empty response. Please try again.');
    }

    return data.candidates[0].content.parts[0].text;
}

// === Response Parsing ===
function parseResponse(responseText) {
    const promptMatch = responseText.match(/===PROMPT_START===([\s\S]*?)===PROMPT_END===/);
    const toolMatch = responseText.match(/===TOOL_START===([\s\S]*?)===TOOL_END===/);

    const prompt = promptMatch ? promptMatch[1].trim() : null;
    const toolSection = toolMatch ? toolMatch[1].trim() : null;

    let name = 'Unknown';
    let reasoning = '';

    if (toolSection) {
        const toolNameMatch = toolSection.match(/TOOL:\s*(.+)/);
        const reasoningMatch = toolSection.match(/REASONING:\s*([\s\S]+)/);
        if (toolNameMatch) name = toolNameMatch[1].trim();
        if (reasoningMatch) reasoning = reasoningMatch[1].trim();
    }

    return { prompt, toolName: name, toolReasoning: reasoning };
}

// === Display Results ===
function displayResults(result) {
    if (!result.prompt) {
        showError('Received an unexpected response format. Please try again.');
        return;
    }

    generatedPrompt.textContent = result.prompt;
    toolName.textContent = result.toolName;
    toolReasoning.textContent = result.toolReasoning;
    resultsEl.classList.remove('hidden');

    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === Copy to Clipboard ===
copyBtn.addEventListener('click', () => {
    const text = generatedPrompt.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Copy to Clipboard';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});

// === Generate Handler ===
generateBtn.addEventListener('click', async () => {
    const position = getPosition();
    const task = taskInput.value.trim();

    if (!position || !task) {
        showError('Please select a position and describe your task.');
        return;
    }

    clearError();
    showLoading();

    try {
        const responseText = await callAPI(position, task);
        const result = parseResponse(responseText);
        hideLoading();
        displayResults(result);
    } catch (err) {
        hideLoading();
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            showError('Network error. Please check your internet connection.');
        } else {
            showError(err.message);
        }
    }
});

// === Initialize ===
updateGenerateButton();
