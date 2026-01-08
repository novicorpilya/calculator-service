export class InfrastructureError extends Error {
    public readonly code: string;
    public readonly originalError?: unknown;

    constructor(code: string, originalError?: unknown, message?: string) {
        super(message || `Infrastructure error: ${code}`);
        this.code = code;
        this.originalError = originalError;
        this.name = 'InfrastructureError';
    }
}

export class ApplicationError extends Error {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = 'ApplicationError';
    }
}
