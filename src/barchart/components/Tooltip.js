import * as Defaults from "../defaults/BarchartDefaults";
import Component from "./Component";
import style from "../Barchart.css";
import * as d3 from "d3";

class Tooltip extends Component {

	constructor(
		{
			fontSize = Defaults.TOOLTIP_FONT_SIZE,
			width = fontSize,
			height = fontSize,
			symbol,
			activeColor = Defaults.ACTIVE_COLORS[0],
			format = Defaults.FORMAT,
			space = Defaults.TOOLTIP_SPACE
		}
	) {
		super(width, height, "tooltip", true, true);
		this._fontSize = fontSize;
		this._symbol = symbol;
		this._activeColor = activeColor;
		this._format = format;
		this._space = space;
	}

	_render() {

		this.container.append("text")
			.text("-")
			.attr("class", style["tooltip-text"])
			.attr("text-anchor","end")
			.attr("font-size", this.fontSize);

	}

	/**
	 * @param {TooltipData} data
	 */
	_setData(data) {

		let format = this.format;
		if (!this.format.includes('.')) {
			const spec = d3.formatSpecifier(this.format);
			spec.precision = data.getPrecision("max");
			format = spec.toString();
		}

		let text = data.text;
		if (data.isNumber()) {
			text = d3.format(format)(data.text);
		}

		const tooltipText = this.container.select(`.${style["tooltip-text"]}`)
			.text(text);

		let tooltipWidth = tooltipText.node().getBBox().width;

		if (data.symbol || this.symbol) {

			let color;
			if (data.color instanceof Array) {
				this._renderTwoColoredFill(data.color[0], data.color[1]);
				color = "url(#two-colored-symbol-"+this._maskIndex+")";
			} else if (this.activeColor instanceof Array) {
				this._renderTwoColoredFill(this.activeColor[0], this.activeColor[1]);
				color = "url(#two-colored-symbol-"+this._maskIndex+")";
			} else {
				color = data.color ? data.color : this.activeColor;
			}

			const tooltipSymbol = this.container.append("text")
				.text(data.symbol ? data.symbol : this.symbol)
				.attr("class", style["symbol"])
				.attr("text-anchor","end")
				.attr("font-size", this.fontSize)
				.attr("fill", color)
				.attr("x", -tooltipWidth - this.space);

			tooltipWidth += tooltipSymbol.node().getBBox().width + this.space;
		}

		this.width = tooltipWidth;
		this.height = tooltipText.node().getBBox().height;

	}

	_renderTwoColoredFill(color1, color2) {

		const twoColoredFill = this.container.append("pattern")
			.attr("id", "two-colored-symbol-"+this._maskIndex)
			.attr("width", "1")
			.attr("height", "1")
			.attr("patternContentUnits", "objectBoundingBox");

		twoColoredFill.append('rect')
			.attr('fill', color1)
			.attr("width", "1")
			.attr("height", "1");

		twoColoredFill.append('path')
			.attr('fill', color2)
			.attr('d', 'M0,0 L1,0 L0,1 Z');
	}

	_clearData() {
		this.container.select(`.${style["tooltip-text"]}`)
			.text("-");

		this.container.select(`.${style["symbol"]}`).remove()
	}

	get fontSize() {
		return this._fontSize;
	}

	get symbol() {
		return this._symbol;
	}

	get activeColor() {
		return this._activeColor;
	}

	get format() {
		return this._format;
	}

	get space() {
		return this._space;
	}
}

export default Tooltip;
