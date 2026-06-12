import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import TerminalView from "./components/TerminalView.jsx";

const RELAY_URL = import.meta.env.VITE_RELAY_URL || "ws://localhost:8080";
const DIGIT_COUNT = 6;
const PILLS = ["Peer-to-peer", "Encrypted", "Zero config", "Free forever"];

function createEmptyDigits() {
  return Array.from({ length: DIGIT_COUNT }, () => "");
}

function formatDisplayCode(code) {
  const digits = code.replace(/\D/g, "").slice(0, DIGIT_COUNT);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
}

export default function App() {
  const [digits, setDigits] = useState(createEmptyDigits);
  const [screen, setScreen] = useState("connect");
  const [errorMessage, setErrorMessage] = useState("");
  const [terminalError, setTerminalError] = useState("Agent disconnected");
  const [isConnecting, setIsConnecting] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [session, setSession] = useState({ ws: null, code: "" });

  const inputRefs = useRef([]);
  const socketRef = useRef(null);
  const reconnectHandledRef = useRef(false);
  const joinedRef = useRef(false);
  const connectingRef = useRef(false);
  const sessionCodeRef = useRef("");
  const animationTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  const enteredCode = digits.join("");
  const isComplete = enteredCode.length === DIGIT_COUNT;

  useEffect(() => {
    animationTimerRef.current = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 80 + DIGIT_COUNT * 55);

    return () => {
      clearTimeout(animationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(errorTimerRef.current);

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  function focusInput(index) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function resetToConnectScreen() {
    reconnectHandledRef.current = false;
    joinedRef.current = false;
    connectingRef.current = false;
    socketRef.current = null;
    sessionCodeRef.current = "";
    setSession({ ws: null, code: "" });
    setDigits(createEmptyDigits());
    setErrorMessage("");
    setIsConnecting(false);
    setScreen("connect");

    requestAnimationFrame(() => {
      focusInput(0);
    });
  }

  function showInlineError(message) {
    setErrorMessage(message);
    setShakeError(true);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setShakeError(false);
    }, 600);
  }

  function moveFocus(index, direction) {
    const nextIndex = index + direction;

    if (nextIndex >= 0 && nextIndex < DIGIT_COUNT) {
      focusInput(nextIndex);
    }
  }

  function updateDigit(index, value) {
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function handleInput(index, event) {
    const value = event.target.value.replace(/\D/g, "").slice(-1);

    if (!value) {
      updateDigit(index, "");
      return;
    }

    updateDigit(index, value);
    setErrorMessage("");

    if (index < DIGIT_COUNT - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (digits[index]) {
        updateDigit(index, "");
        return;
      }

      if (index > 0) {
        updateDigit(index - 1, "");
        focusInput(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(index, -1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(index, 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (isComplete) {
        connectToRelay();
      }

      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);

    if (!pastedDigits) {
      return;
    }

    const nextDigits = createEmptyDigits();

    pastedDigits.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setDigits(nextDigits);
    setErrorMessage("");

    requestAnimationFrame(() => {
      focusInput(Math.min(pastedDigits.length - 1, DIGIT_COUNT - 1));
    });
  }

  function handleDisconnect() {
    if (reconnectHandledRef.current || screen !== "terminal") {
      return;
    }

    reconnectHandledRef.current = true;
    socketRef.current = null;
    setTerminalError("Agent disconnected");
    setSession({ ws: null, code: sessionCodeRef.current });
    setScreen("error");
  }

  function connectToRelay() {
    if (!isComplete || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setErrorMessage("");
    reconnectHandledRef.current = false;
    joinedRef.current = false;
    connectingRef.current = true;
    sessionCodeRef.current = enteredCode;

    const ws = new WebSocket(RELAY_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          code: enteredCode
        })
      );
    };

    ws.onmessage = (event) => {
      let payload;

      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (payload?.type === "joined") {
        joinedRef.current = true;
        connectingRef.current = false;
        setSession({ ws, code: enteredCode });
        setIsConnecting(false);
        setErrorMessage("");
        setScreen("terminal");
        return;
      }

      if (payload?.type === "error") {
        connectingRef.current = false;
        showInlineError(payload.message || "Unable to connect");
        setIsConnecting(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      if (joinedRef.current) {
        return;
      }

      connectingRef.current = false;
      setIsConnecting(false);
      setTerminalError("Connection failed");
      setScreen("error");
    };

    ws.onclose = () => {
      if (joinedRef.current) {
        socketRef.current = null;
        setTerminalError("Agent disconnected");
        setSession({ ws: null, code: sessionCodeRef.current });
        setScreen("error");
        return;
      }

      if (connectingRef.current) {
        connectingRef.current = false;
        setIsConnecting(false);
      }
    };
  }

  function disconnectSession() {
    if (socketRef.current) {
      socketRef.current.close();
    }

    resetToConnectScreen();
  }

  if (screen === "terminal" && session.ws) {
    return (
      <main className="app app-terminal">
        <header className="terminal-topbar">
          <div className="terminal-topbar__left">
            <Link className="app-backlink" to="/">
              Back to Home
            </Link>
            <div className="code-badge">
              code: <span>{formatDisplayCode(session.code)}</span>
            </div>
            <div className="session-status">
              <span className="session-status__dot" />
              <span>Session active</span>
            </div>
          </div>

          <button className="disconnect-button" type="button" onClick={disconnectSession}>
            Disconnect
          </button>
        </header>

        <section className="terminal-stage">
          <TerminalView ws={session.ws} onDisconnect={handleDisconnect} />
        </section>
      </main>
    );
  }

  if (screen === "error") {
    return (
      <main className="app error-screen">
        <div className="error-screen__nav">
          <Link className="app-backlink" to="/">
            Back to Home
          </Link>
        </div>
        <div className="error-screen__icon">x</div>
        <h1 className="error-screen__title">Connection lost</h1>
        <p className="error-screen__message">{terminalError}</p>
        <button className="primary-button error-screen__button" type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="app connect-screen">
      <header className="connect-nav">
        <Link className="connect-nav__logo" to="/">
          <span>Hi</span>
          <span>Ping</span>
        </Link>

        <Link className="app-backlink" to="/">
          Back to Home
        </Link>
      </header>

      <section className="connect-panel">
        <p className="eyebrow">// remote access</p>
        <h1 className="connect-title">Enter your pairing code</h1>
        <p className="connect-copy">
          Type the 6-digit code shown on your Windows machine to start a remote session.
        </p>

        <div className="code-inputs" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <div className="code-inputs__slot" key={index}>
              <input
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                className={`code-input ${digit ? "is-filled" : ""} ${shakeError ? "has-error" : ""}`}
                style={{ animationDelay: `${80 + index * 55}ms` }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete="off"
                value={digit}
                onChange={(event) => handleInput(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
                disabled={isConnecting}
              />
              {index === 2 ? <span className="code-separator">-</span> : null}
            </div>
          ))}
        </div>

        <button className="primary-button connect-button" type="button" onClick={connectToRelay} disabled={!isComplete || isConnecting}>
          {isConnecting ? "Connecting..." : "Connect ->"}
        </button>

        <p className="connect-error">{errorMessage}</p>

        <div className="pill-row">
          {PILLS.map((pill) => (
            <span className="pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>

        <div className="install-hint">
          <p className="install-hint__label">// don't have the agent?</p>
          <code className="install-hint__code">
            <span>$</span> npm install -g hiping-agent && hiping start
          </code>
        </div>
      </section>
    </main>
  );
}
