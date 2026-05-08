type FeedbackData = {
  useCase: string;
  featureRequests: string;
  generalFeedback: string;
  usageFrequency: string;
  appFeedbackId: string;
};

export type ContentReportData = {
  category: string;
  description: string;
  includeModelInfo: boolean;
  modelId?: string;
  modelOid?: string;
  appFeedbackId: string;
  isContentReport: true;
};

export type ModelLoadErrorReportData = {
  reportType: 'model-load-error';
  version: 1;
  appFeedbackId: string;
  errorMessage: string;
  modelInfo?: {
    name?: string;
    id?: string;
    url?: string;
    size?: number;
  };
  contextParams?: Record<string, unknown>;
  deviceInfo?: {
    model?: string;
    systemName?: string;
    systemVersion?: string;
    totalMemory?: number;
    cpuArch?: string[];
    isEmulator?: boolean;
  };
  additionalInfo?: string;
};

export async function submitContentReport(
  _reportData: Omit<ContentReportData, 'appFeedbackId'>,
): Promise<{message: string}> {
  throw new Error('Content reporting is not available in this build.');
}

export async function submitFeedback(
  _feedbackData: Omit<FeedbackData, 'appFeedbackId'>,
): Promise<{message: string}> {
  throw new Error('Feedback submission is not available in this build.');
}

export async function submitModelLoadErrorReport(
  _reportData: any,
): Promise<{message: string}> {
  throw new Error('Model error reporting is not available in this build.');
}
