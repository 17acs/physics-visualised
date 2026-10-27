import type { CSSProperties, ReactNode } from "react";

const mathStyle: CSSProperties = {
  letterSpacing: "0.01em",
};

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        verticalAlign: "middle",
        margin: "0 0.2em",
      }}
    >
      <span
        style={{
          padding: "0 0.35em 0.12em",
          borderBottom: "1.5px solid rgba(242,245,255,0.88)",
          lineHeight: 1.15,
        }}
      >
        {num}
      </span>
      <span style={{ padding: "0.12em 0.35em 0", lineHeight: 1.15 }}>{den}</span>
    </span>
  );
}

export function IntegralFromTo({ a, b, integrand }: { a: ReactNode; b: ReactNode; integrand: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <span className="mathIntegralLimits">
        <span className="mathIntegralLimit">{b}</span>
        <span className="mathIntegralSign">∫</span>
        <span className="mathIntegralLimit">{a}</span>
      </span>
      <span>{integrand}</span>
    </span>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <sub style={{ fontSize: "0.72em", verticalAlign: "baseline", position: "relative", bottom: "-0.18em" }}>
      {children}
    </sub>
  );
}

function MathEqRow({ children }: { children: ReactNode }) {
  return (
    <div className="eq mathEq" style={mathStyle}>
      <span className="mathEqInner">{children}</span>
    </div>
  );
}

export function SimpsonsRuleFormula() {
  return (
    <div className="mathEqStack">
      <MathEqRow>
        <IntegralFromTo a="a" b="b" integrand={<span>f(x) dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="h" den="3" />
        <span style={{ marginLeft: "0.15em" }}>
          [
          <span style={{ margin: "0 0.2em" }}>
            f(x<Sub>0</Sub>) + 4f(x<Sub>1</Sub>) + 2f(x<Sub>2</Sub>) + 4f(x<Sub>3</Sub>) + ⋯ + f(x<Sub>n</Sub>)
          </span>
          ]
        </span>
      </MathEqRow>

      <div className="mathEqOr">or</div>

      <MathEqRow>
        <IntegralFromTo a="a" b="b" integrand={<span>f(x) dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="h" den="3" />
        <span style={{ marginLeft: "0.15em" }}>[ ends + 4(odds) + 2(evens) ]</span>
      </MathEqRow>
    </div>
  );
}

