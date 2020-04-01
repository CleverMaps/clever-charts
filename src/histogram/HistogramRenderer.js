import style from "./Histogram.css";
import HistogramSelectionRenderer from "./selection/HistogramSelectionRenderer";
import * as Defaults from "./HistogramDefaults";
import Observable from "../utils/Observable";
import * as d3 from "d3";

/**
 * @class
 * Histogram renderer class
 * @param {Object} options
 */
export default class HistogramRenderer {
    constructor(options) {
		/**
		 * @private 
		 * Histogram options
		 */
		this._options = options;

		/**
		 * @private 
		 * DOM container of this widget
		 */
		this._containerEl = null;

		/**
		 * @private 
		 * Main group element of this widget
		 */
		this._groupEl = null;

		/**
		 * @private 
		 * Main SVG element of this widget
		 */
		this._svgEl = null;

		/**
		 * @private
		 * Bar data 
		 */
		this._historyData = null;

		/**
		 * @private
		 * X axis
		 */
		this._xAxis = d3.scaleBand().range([0, options.width]);

		/**
		 * @private
		 * Y axis
		 */
		this._yAxis = d3.scaleLinear().range([options.maxBarHeight, 0]);

		/**
		 * @private
		 * true if histogram has been rendered
		 */
		this._rendered = false;

		/**
		 * @private
		 * stores previous data for animation
		 */
		this._prevData = null;

		/**
		 * @private
		 * selection renderer
		 */
		this._selectionRenderer = new HistogramSelectionRenderer(options);

		/**
		 * @private
		 * True if labels are visible
		 */
		this._labelsVisible = false;

		/**
		 * @private
		 * observable handler
		 */
		this._observable = new Observable([
			/**
			 * @event 
			 * Fires when mouse is over a category
			 * @param {int} selectionIndex
			 */
			"selectionOver",
			/**
			 * @event 
			 * Fires when selection is toggled
			 * @param {int} selectionIndex
			 * @param {bool} enabled
			 */
			"toggleSelection",
			/**
			 * @event 
			 * Fires when selection is changed
			 * @param {Array} selection
			 */
			"selectionChanged",
			/**
			 * @event 
			 * Fires when user clicks on a handle
			 * @param {int} handleIndex
			 * @param {Number} handleValue
			 */
			"handleClick"
		]);		

		// relay selection events
		this._selectionRenderer.on("selectionOver", (selectionIndex)=>{
			this._observable.fire("selectionOver", selectionIndex);
		});

		this._selectionRenderer.on("toggleSelection", (selectionIndex, enabled)=>{
			this._observable.fire("toggleSelection", selectionIndex, enabled);
		});

		this._selectionRenderer.on("selectionChanged", (selection)=>{
			this._observable.fire("selectionChanged", selection);
		});

		this._selectionRenderer.on("handleClick", (handleIndex, handleValue)=>{
			this._observable.fire("handleClick", handleIndex, handleValue);
		});		
    }

	/**
	 * @public
	 * Returns whether histogram has been rendered or not
	 * @returns {boolean} true if histogram has been rendered
	 */
	isRendered(){
		return this._rendered;
	}

	/**
	 * @public
	 * Bind handle event
	 * @param {String} event event name
	 * @param {Function} handler event handler
	 * @returns {HistogramHandle} returns this handle instance
	 */
	on(eventName, handler) {
		this._observable.on(eventName, handler);
		return this;
	}	

	/**
	 * @public
	 * Render logic of this widget
	 * @param {String|DOMElement} selector selector or DOM element 
	 * @returns {Histogram} returns this widget instance
	 */
	render(selector){
		// get container element using selector or given element
		var ct = this._containerEl = d3.select(selector);
		var width = this._options.width;
		var height = this._options.height;
		var margin = Defaults.MARGIN;

		// render SVG
		var svg = this._svgEl = ct.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + this._options.fontSize + margin.bottom)
			.classed(style.histogram, true);

		// render group element
		var g = this._groupEl = this._svgEl.append("g")
			.classed(style.inactive, true)
			.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

		// handle hover over svg element
		svg.on("mouseover.hover", ()=>{
			g.classed(style.active, true)
			g.classed(style.inactive, false)
		})

		svg.on("mouseout.hover", ()=>{
			g.classed(style.inactive, true)
			g.classed(style.active, false)
		})

		this._selectionRenderer.render(g);

		this._rendered = true;

		return this;
	} 

	/**
	 * @private
	 * Clears selection controls and data 
	 */
	_clear(){
		this._groupEl.node().innerHTML = "";
	}

	/**
	 * @private
	 * Refreshes histogram data 
	 * @param {HistogramData}
	 * @param {HistogramSelection}
	 * @param {Object} options
	 */
	refresh(histogramData, histogramSelection, options){
		this._animate = options && options.animate;

		this._histogramData = histogramData;		
		this._clear();

		this._xAxis.domain(histogramData.getData().map(function (d) {return d.value; }));
		this._yAxis.domain([0, d3.max(histogramData.getData(), function (d) { return Math.max.apply(Math, d.volume); })]);

		this._renderXAxis();		
		this._renderDataBars();

		this._prevData = histogramData.getData();			

		this._selectionRenderer.refresh(histogramData, histogramSelection, options);	

		if (this._labelsVisible){
			this.showSelectionLabels()
		}

		return this;
	}

	setSelection(histogramSelection, options){
		this._selectionRenderer.setSelection(histogramSelection, options);
	}

	/**
	 * Shows selection labels
	 */
	showSelectionLabels(){
		this._selectionRenderer.showSelectionLabels();
		// hide axis labels when selection labels are visible
		this._groupEl.selectAll("."+style["x-axis"]).attr("display", "none");
		this._labelsVisible = true;
	}

	/**
	 * Hides selection labels
	 */
	hideSelectionLabels(){
		this._selectionRenderer.hideSelectionLabels();
		// show axis labels when selection labels are not visible
		this._groupEl.selectAll("."+style["x-axis"]).attr("display", "block");		
		this._labelsVisible = false;
	}	

	/**
	 * @private
	 * Renders data bars
	*/
	_renderDataBars() { 
		var data = this._histogramData.getData();
		// var prevData = this._prevData;
		var height = this._options.height;
		var maxBarHeight = this._options.maxBarHeight;
		var topMargin = height-maxBarHeight;

		var y = this._yAxis;

		data.forEach(d=>{
			d.volume.forEach((v, i)=>{
				this._groupEl
					.append("rect")
					.datum({
						value:d.value,
						volumeIndex:i
					})
					.attr("class", style.bar)
					.attr("x", this._histogramData.valueToPosition(d.value))
					.attr("width", "1")
					.attr("y", topMargin + Math.floor(y(d.volume[i])))
					.attr("height", Math.ceil(maxBarHeight - y(d.volume[i])))
			});
		});
	}

	/**
	* @private
	* Renders X axis 
	*/        
	_renderXAxis(){
		var minMax = this._histogramData.getMinMax();
		var format = this._options.format;
		var height = this._options.height + this._options.fontSize + Defaults.LABEL_MARGIN;

		this._groupEl.selectAll("."+style["x-axis"])
			.data([minMax.min, minMax.max])
			.enter()
			.append("text")
			.text((d)=>format(d))
			.attr("font-size", this._options.fontSize)
			.attr("transform", (d, i)=>{
				return [
					"translate("+0+"," + height + ")",
					"translate("+this._options.width+"," + height + ")"
				][i]
			})
			.attr("text-anchor", function(d, i){
				return ["start", "end"][i];
			})
			.classed(style["x-axis"], true)
	}

	/**
	 * @public
	 * Destorys histogram UI  
	 */
	destroy() {
		if (this._rendered){
			this._containerEl.node().removeChild(this._svgEl.node());
		}

		this._observable.destroy();
		this._selectionRenderer.destroy();

		return this;
    }	
	
}