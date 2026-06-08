import "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          poster?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "ar-placement"?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          exposure?: string;
          loading?: string;
          "touch-action"?: string;
          style?: React.CSSProperties;
          ref?: React.Ref<HTMLElement>;
        },
        HTMLElement
      >;
    }
  }
}
