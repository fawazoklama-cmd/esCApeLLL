import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = error.message || 'Unexpected application error.';
    if (message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message) as { error?: string; operationType?: string };
        if (parsed.error) {
          message = parsed.error;
        }
      } catch {
        // Keep raw message if not valid JSON
      }
    }
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('esCApeLL ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#111827] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#18182e] border border-white/15 p-6 text-center">
            <img
              src="/assets/aistudio/file_00000000f6b48211b105b2ef73ff175f_663e38f0.png"
              alt="esCApeLL"
              className="w-52 mx-auto h-auto"
            />
            <p className="mt-3 text-sm text-slate-300">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#6EB4FF] text-[#111827] font-bold text-sm cursor-pointer"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
