const DEFAULT_TIMEOUT_MS = 4000;

function getMode() {
    const mode = (process.env.HEALTHI_ENFORCEMENT_MODE || 'strict').toLowerCase();
    return mode === 'permissive' ? 'permissive' : 'strict';
}

function isConfigured() {
    return Boolean(process.env.HEALTHI_VALIDATE_URL);
}

async function callHealthiValidation(payload) {
    const endpoint = process.env.HEALTHI_VALIDATE_URL;
    if (!endpoint) {
        throw new Error('HEALTHI_VALIDATE_URL is not configured');
    }

    const timeoutMs = Number(process.env.HEALTHI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (process.env.HEALTHI_API_KEY) {
            headers['x-api-key'] = process.env.HEALTHI_API_KEY;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Healthi validation failed (${res.status}): ${text || 'No body'}`);
        }

        const data = await res.json();
        if (!data || typeof data !== 'object') {
            throw new Error('Healthi validation response is invalid');
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    isConfigured,
    getMode,
    callHealthiValidation,
};
