import type { CSSProperties, ReactNode } from "react";
import { IntegralFromTo } from "../simpsons-rule/SimpsonFormula";

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

export function MidOrdinateRuleFormula() {
  return (
    <div className="mathEqStack">
      <MathEqRow>
        <IntegralFromTo a="a" b="b" integrand={<span>f(x) dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <span>h</span>
        <span style={{ marginLeft: "0.15em" }}>
          [
          <span style={{ margin: "0 0.2em" }}>
            f(m<Sub>1</Sub>) + f(m<Sub>2</Sub>) + ⋯ + f(m<Sub>n</Sub>)
          </span>
          ]
        </span>
      </MathEqRow>

      <div className="mathEqLegend">
        <div className="mathEqLegendRow">
          <span className="mathEqLegendLabel">mᵢ</span>
          <span className="mathEqLegendItems">
            midpoint of strip i - halfway between x<Sub>i−1</Sub> and x<Sub>i</Sub>
          </span>
        </div>
      </div>
    </div>
  );
}

export function MidOrdinateWorkedExample() {
  return (
    <div className="eq mathEq" style={mathStyle}>
      <span className="mathEqInner">
        <IntegralFromTo a="0" b="2" integrand={<span>x² dx</span>} />
        <span style={{ margin: "0 0.35em" }}>≈</span>
        <span>0.5</span>
        <span style={{ margin: "0 0.2em" }}>[0.0625 + 0.5625 + 1.5625 + 3.0625] = 2.625</span>
        <span style={{ margin: "0 0.35em", opacity: 0.75 }}>(exact 8/3)</span>
      </span>
    </div>
  );
}
