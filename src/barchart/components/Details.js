import * as Defaults from "../defaults/BarchartDefaults";
import Component from "./Component";
import style from "../Barchart.css";
import * as d3 from "d3";
import Tooltip from "./Tooltip";
import OnlyTool from "./OnlyTool";
import * as CleverChartsUtils from "../../utils/CleverChartsUtils";

class Details extends Component {

	constructor(
		{
			width = Defaults.WIDTH,
			height = labelFontSize + 10,
			labelFontSize = Defaults.LABEL_FONT_SIZE,
			tooltipFontSize = Defaults.TOOLTIP_FONT_SIZE,
			tooltipSymbol = Defaults.TOOLTIP_SYMBOL,
			activeColors = Defaults.ACTIVE_COLORS,
			format = Defaults.FORMAT,
			horizontalPadding = Defaults.HORIZONTAL_PADDING,
			showOnlyTool = Defaults.SHOW_ONLY_TOOL,
			onlyToolText = Defaults.ONLY_TOOL_TEXT,
			enableToggle = Defaults.ENABLE_BAR_TOGGLE,
			showLabelCircle = Defaults.SHOW_LABEL_CIRCLE
		}
	) {
		super(width, height, "details");
		this._labelFontSize = labelFontSize;
		this._tooltipFontSize = tooltipFontSize;
		this._tooltipSymbol = tooltipSymbol;
		this._activeColors = activeColors;
		this._format = format;
		this._horizontalPadding = horizontalPadding;
		this._showOnlyTool = showOnlyTool;
		this._onlyToolText = onlyToolText;
		this._enableToggle = enableToggle;
		this._showLabelCircle = showLabelCircle;

		this._tooltips;
		this._tooltipsBackground;
		this._label;
		this._labelCircle;

		this._tipWrapper;
		this._tip;
		this._canvas;

		this._observable
			.add("selectOnly");
	}

	_render() {
		let labelPadding = this.horizontalPadding;

		if (this.showLabelCircle) {
			labelPadding = this.horizontalPadding + 2 * Defaults.LABEL_CIRCLE_RADIUS + 10;
			this._labelCircle = this.container.append("circle")
				.attr("r", Defaults.LABEL_CIRCLE_RADIUS)
				.attr("fill", 'transparent')
				.attr("cx", Defaults.LABEL_CIRCLE_RADIUS)
				.attr("cy", 2 * this.labelFontSize/3);
		}

		this._label = this.container.append("text")
			.text("")
			.attr("class", style["label"])
			.attr("x", labelPadding)
			.attr("y", this.labelFontSize)
			.attr("font-size", this.labelFontSize);

		const gradient = this.container.append("linearGradient")
			.attr("id", "tooltips-background");

		gradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", "white")
			.attr("stop-opacity", "0");
		gradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "white")
			.attr("stop-opacity", "1");

		if (d3.select(".text-width-helper").empty()) {
			this._canvas = d3.select("body")
				.append('canvas')
				.attr("class", "text-width-helper")
				.style("display","none")
				.text("Helper element for computing text width");
		} else {
			this._canvas = d3.select(".text-width-helper");
		}

		if (d3.select('.' + style["tip"]).empty()) {
			this._tipWrapper = d3.select("body").append('span')
				.attr("class", style['tip-wrapper']);
			this._tip = this._tipWrapper.append('span')
				.attr("class", style['tip']);
		} else {
			this._tipWrapper = d3.select('.' + style["tip-wrapper"]);
			this._tip = d3.select('.' + style["tip"]);
		}
	}

	/**
	 * @param {DetailsData} data
	 */
	_setData(data) {
		this._clearData();

		if (this._labelCircle) {
			this._labelCircle.attr('fill', data.color);
		}

		this._label.text(data.label);
		this.container.classed(style['details-disabled'], data.disabled);

		if (data.tooltips) {
			this._createTooltips(data);
			this._renderAndSetTooltipsData(data.tooltips);
		}

		if (this.showOnlyTool && this.enableToggle) {
			this._createOnlyTool();
			this._renderOnlyTool();
		}

		if (CleverChartsUtils.calculateTextWidth(this._label, this._canvas) > this._rightSideStart) {
			this._handleLongLabel(this._rightSideStart);
		}
	}

	_createOnlyTool() {
		this._onlyTool = new OnlyTool({
			fontSize: this.tooltipFontSize - 1,
			onlyToolText: this.onlyToolText
		});
	}

	_renderOnlyTool() {
		const index = this.container.datum();
		this._onlyTool.render(this.container.node(), this._rightSideStart, this.labelFontSize - 1, index)
			.on("click", (index) => {
				d3.event.stopPropagation();
				this._observable.fire("selectOnly", index);
			});
		this._rightSideStart -= this._onlyTool.width + 24;
	}

	/**
	 * @param {DetailsData} detailsData
	 */
	_createTooltips(detailsData) {
		const tooltipsData = detailsData.tooltips;
		const tooltipsReversed = tooltipsData.slice();
		tooltipsReversed.reverse();

		let format = this.format;
		if (!this.format.includes('.')) {
			const spec = d3.formatSpecifier(this.format);
			spec.precision = detailsData.getPrecision("max");
			format = spec.toString();
		}

		this._tooltips = tooltipsData.map((_, index) => new Tooltip({
			fontSize: this.tooltipFontSize,
			symbol: tooltipsData.length>1 ? this.tooltipSymbol : undefined,
			activeColor: this.activeColors[index % this.activeColors.length],
			format: format
		}));
	}

	/**
	 * @param {TooltipData[]} tooltipsData
	 */
	_renderAndSetTooltipsData(tooltipsData) {
		let previousTooltipX = this.width - this.horizontalPadding;
		this._tooltips.forEach((_, index) => {
			const reversedIndex = this._tooltips.length - 1 - index;
			const tooltipReversed = this._tooltips[reversedIndex];
			const tooltipData = tooltipsData[reversedIndex];

			tooltipReversed.render(this.container.node(), previousTooltipX, this.labelFontSize, reversedIndex);
			tooltipReversed.setData(tooltipData);

			previousTooltipX -= tooltipReversed.width + 24;
		});

		this._rightSideStart = previousTooltipX + 12;
	}

	_handleLongLabel(maxWidth) {
		// render white background under values
		this._tooltipsBackground = this.container
			.insert("g", "g." + style["tooltip"]);

		const gradientWidth = 40;
		const xOffset = -10;
		this._tooltipsBackground
			.append("rect")
			.attr("x", maxWidth - xOffset)
			.attr("y", 0)
			.attr("width", this.width - maxWidth + xOffset)
			.attr("height", this.height)
			.attr("fill", "white");
		this._tooltipsBackground
			.append("rect")
			.attr("x", maxWidth - xOffset - gradientWidth)
			.attr("y", 0)
			.attr("width", gradientWidth + 1) // 1 px extra looks better
			.attr("height", this.height)
			.attr("fill", "url(#tooltips-background)");

		// handle label tooltips
		this._label.on("mouseenter", () => {
			const right = document.documentElement.getBoundingClientRect().width
				- this._getOffset(this._label.node()).left;
			this._tipWrapper
				.style("right", right + "px")
				.style("top", this._getOffset(this._label.node()).top + "px");
			this._tip
				.text(this._label.text())
				.style("transition-delay", ".5s")
				.style("transform", "scale(1)")
		});
		this._label.on("mouseleave", () => {
			this._tip
				.style("transition-delay", "0s")
				.style("transform", "scale(0)");
		});
	}

	_getOffset(el) {
		const rect = el.getBoundingClientRect();
		return {
			left: rect.left + window.scrollX,
			top: rect.top + window.scrollY
		};
	}

	_clearData() {
		this.container.select(`.${style["label"]}`).text("-");
		this.container.selectAll(`.${style["tooltip"]}`).remove();
	}

	get labelFontSize() {
		return this._labelFontSize;
	}

	get tooltipFontSize() {
		return this._tooltipFontSize;
	}

	get tooltipSymbol() {
		return this._tooltipSymbol;
	}

	get activeColors() {
		return this._activeColors;
	}
	set activeColors(activeColors) {
		this._activeColors = activeColors;
	}

	get format() {
		return this._format;
	}
	set format(format) {
		this._format = format;
	}

	get horizontalPadding() {
		return this._horizontalPadding;
	}

	get tooltips() {
		return this._tooltips;
	}

	get showOnlyTool() {
		return this._showOnlyTool;
	}

	get onlyToolText() {
		return this._onlyToolText;
	}

	get enableToggle() {
		return this._enableToggle;
	}

	get showLabelCircle() {
		return this._showLabelCircle;
	}
}

export default Details;
