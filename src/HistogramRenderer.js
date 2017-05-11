import style from "./Histogram.css";
import HistogramSelectionRenderer from "./selection/HistogramSelectionRenderer";
import * as Defaults from "./HistogramDefaults";
import Observable from "./utils/Observable";
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
		this._yAxis = d3.scaleLinear().range([options.height, 0]);

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
			.attr("height", height + margin.top + margin.bottom);

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
	 */
	refresh(histogramData, histogramSelection){
		this._histogramData = histogramData;		
		this._clear();

		this._xAxis.domain(histogramData.getData().map(function (d) {return d.value; }));
		this._yAxis.domain([0, d3.max(histogramData.getData(), function (d) { return d.volume; })]);

		this._renderXAxis();		
		this._renderDataBars();

		this._prevData = histogramData.getData();			

		this._selectionRenderer.refresh(histogramData, histogramSelection);	

		return this;
	}

	/**
	 * @private
	 * Renders data bars
	*/
	_renderDataBars() { 
		var data = this._histogramData.getData();
		var prevData = this._prevData;
		var height = this._options.height;

		var x = this._xAxis;
		var y = this._yAxis;

		// animate from previous data if available
		if (prevData){
			x.domain(prevData.map(function (d) {return d.value; }));
			y.domain([0, d3.max(prevData, function (d) { return d.volume; })]);

			this._groupEl.selectAll("."+style.bar)
				.data(prevData)
				.enter().append("rect")
				.attr("class", style.bar)
				.attr("x", function (d) { return x(d.value); })
				.attr("width", x.bandwidth())
				.attr("y", function (d) { return Math.floor(y(d.volume)); })
				.attr("height", function (d) {return Math.ceil(height - y(d.volume)); })

			x.domain(data.map(function (d) {return d.value; }));
			y.domain([0, d3.max(data, function (d) { return d.volume; })]);				

			this._groupEl.selectAll("."+style.bar)
				.data(data)
				.transition()
				.duration(500)
				.attr("y", function (d) { return Math.floor(y(d.volume)); })
				.attr("height", function (d) { return Math.ceil(height - y(d.volume)); })
		} else {
			// append the rectangles for the bar chart
			this._groupEl.selectAll("."+style.bar)
				.data(data)
				.enter().append("rect")
				.attr("class", style.bar)
				.attr("x", function (d) { return x(d.value); })
				.attr("width", x.bandwidth())
				.attr("y", function (d) { return Math.floor(y(d.volume)); })
				.attr("height", function (d) { return Math.ceil(height - y(d.volume)); })
		}
	}

	/**
	* @private
	* Renders X axis 
	*/        
	_renderXAxis(){
		var minMax = this._histogramData.getMinMax();
		var format = this._options.format;
		var width = this._options.width;
		var height = this._options.height;

		// create bottom axis
		var axis = d3.axisBottom(this._xAxis)
			.tickValues([minMax.min, minMax.max])
			.tickSize(0)
			.tickFormat(format)
			.tickPadding(15);

		var axisGroup = this._groupEl.append("g")
			.attr("transform", "translate(0," + height + ")")
			.classed(style["x-axis"], true)
			.call(axis);

		axisGroup.selectAll(".tick").attr("transform", function(d, i){
			return ["translate(0,0)", "translate("+width+",0)"][i];
		})

		axisGroup.selectAll(".tick>text").attr("x", 0);

		axisGroup.selectAll(".tick").attr("text-anchor", function(d, i){
			return ["start", "end"][i];
		})
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