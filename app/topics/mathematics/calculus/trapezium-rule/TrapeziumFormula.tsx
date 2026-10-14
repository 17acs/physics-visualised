import type { CSSProperties, ReactNode } from "react";
import { Frac, IntegralFromTo } from "../simpsons-rule/SimpsonFormula";

const mathStyle: CSSProperties = {
  letterSpacing: "0.01em",
};

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

export function TrapeziumRuleFormula() {
  return (
    <div className="mathEqStack">
      <MathEqRow>
        <IntegralFromTo a="a" b="b" integrand={<span>f(x) dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="h" den="2" />
        <span style={{ marginLeft: "0.15em" }}>
          [
          <span style={{ margin: "0 0.2em" }}>
            f(x<Sub>0</Sub>) + 2f(x<Sub>1</Sub>) + 2f(x<Sub>2</Sub>) + ⋯ + 2f(x<Sub>n−1</Sub>) + f(x<Sub>n</Sub>)
          </span>
          ]
        </span>
      </MathEqRow>

      <div className="mathEqOr">strip by strip</div>

      <MathEqRow>
        <IntegralFromTo a="a" b="b" integrand={<span>f(x) dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="h" den="2" />
        <span style={{ marginLeft: "0.15em" }}>
          [
          <span style={{ margin: "0 0.2em" }}>
            (y<Sub>0</Sub> + y<Sub>1</Sub>) + (y<Sub>1</Sub> + y<Sub>2</Sub>) + ⋯ + (y<Sub>n−1</Sub> + y<Sub>n</Sub>)
          </span>
          ]
        </span>
      </MathEqRow>
    </div>
  );
}

export function TrapeziumWorkedExample() {
  return (
    <div className="eq mathEq" style={mathStyle}>
      <span className="mathEqInner">
        <IntegralFromTo a="0" b="2" integrand={<span>x² dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <Frac num="0.5" den="2" />
        <span style={{ margin: "0 0.2em" }}>[0 + 2(0.25) + 2(1) + 2(2.25) + 4] = 2.75</span>
        <span style={{ margin: "0 0.35em", opacity: 0.75 }}>(exact 8/3)</span>
      </span>
    </div>
  );
}
