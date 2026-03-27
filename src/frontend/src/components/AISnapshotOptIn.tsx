interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export function AISnapshotOptIn({ onAccept, onDecline }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(8,8,16,0.96)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 18,
            color: "rgba(240,240,248,0.9)",
            lineHeight: 1.75,
            letterSpacing: "0.01em",
          }}
        >
          Veil can create a unique
          <br />
          visual from your emotion.
        </p>
        <p
          style={{
            fontSize: 14,
            color: "rgba(200,200,220,0.65)",
            lineHeight: 1.7,
            fontFamily: "inherit",
          }}
        >
          It uses only how you
          <br />
          felt&nbsp;— never what you wrote.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={onAccept}
            style={{
              background: "rgba(200,196,220,0.18)",
              border: "1px solid rgba(200,196,220,0.35)",
              borderRadius: 24,
              color: "rgba(240,240,248,0.9)",
              fontSize: 14,
              padding: "14px 24px",
              cursor: "pointer",
              fontFamily: "inherit",
              minHeight: 48,
              letterSpacing: "0.02em",
            }}
          >
            Yes&nbsp;— show me
          </button>
          <button
            type="button"
            onClick={onDecline}
            style={{
              background: "none",
              border: "none",
              color: "rgba(180,180,200,0.45)",
              fontSize: 13,
              padding: "12px 24px",
              cursor: "pointer",
              fontFamily: "inherit",
              minHeight: 48,
              letterSpacing: "0.02em",
            }}
          >
            No&nbsp;— just my canvas
          </button>
        </div>
      </div>
    </div>
  );
}
