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

      <div className="mathEqLegend">
        <div className="mathEqLegendRow">
          <span className="mathEqLegendLabel">ends</span>
          <span className="mathEqLegendItems">
            f(x<Sub>0</Sub>), f(x<Sub>n</Sub>)
          </span>
        </div>
        <div className="mathEqLegendRow">
          <span className="mathEqLegendLabel">odds</span>
          <span className="mathEqLegendItems">
            f(x<Sub>1</Sub>), f(x<Sub>3</Sub>), f(x<Sub>5</Sub>), … , f(x<Sub>n−1</Sub>)
          </span>
        </div>
        <div className="mathEqLegendRow">
          <span className="mathEqLegendLabel">evens</span>
          <span className="mathEqLegendItems">
            f(x<Sub>2</Sub>), f(x<Sub>4</Sub>), f(x<Sub>6</Sub>), … , f(x<Sub>n−2</Sub>)
          </span>
        </div>
      </div>
    </div>
  );
}

export function SimpsonsWorkedExample() {
  return (
    <div className="eq mathEq" style={mathStyle}>
      <span className="mathEqInner">
        <IntegralFromTo a="0" b="2" integrand={<span>x² dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="0.5" den="3" />
        <span style={{ margin: "0 0.2em" }}>[0 + 4(0.25) + 2(1) + 4(2.25) + 4] =</span>
        <Frac num="8" den="3" />
      </span>
    </div>
  );
}

export function SimpsonsRuleFormulaCompact() {
  return (
    <span style={{ ...mathStyle, fontSize: "1.05rem" }}>
      <IntegralFromTo a="a" b="b" integrand={<span>f(x) d x</span>} />
    </span>
  );
}
