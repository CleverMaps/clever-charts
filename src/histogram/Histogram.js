import * as d3 from "d3";
import Observable from "../utils/Observable";
import * as Defaults from "./HistogramDefaults";
import HistogramData from "./HistogramData";
import HistogramRenderer from "./HistogramRenderer";
import HistogramSelectionFactory from "./selection/HistogramSelectionFactory"
import {SelectionTypes} from "./selection/HistogramSelection";

/**
 * @private 
 * @param {*} optionValue option value 
 * @param {*} defaultOptionValue default option value 
 * @returns option or default option value 
 */
function getOptionValue(optionValue, defaultOptionValue) {
	return typeof optionValue == "undefined" ? defaultOptionValue : optionValue;
}

/**
 * @class
 * Main histogram class
 * @param {Object} options
 */
class Histogram {
	constructor(options) {
		/**
		 * @private
		 * Options property exposing widget's options
		 */
		this._options = {};

		/**
		 * @public
		 * prompt handler
		 */
		this._options.promptHandler = options.promptHandler || null;
		/**
		 * @public
		 * Width of the widget
		 */
		this._options.width = getOptionValue(options.width, Defaults.WIDTH);
		/**
		 * @public
		 * Height of the widget
		 */
		this._options.height = getOptionValue(options.height, Defaults.HEIGHT);
		/**
		 * @public
		 * Height of the widget
		 */
		this._options.maxBarHeight = getOptionValue(options.maxBarHeight, this._options.height);

		/**
		 * @public
		 * Format for widget labels 
		 */
		this._options.format = getOptionValue(options.format, null);

		/**
		 * @public
		 * Inactive bar color 
		 */
		this._options.inactiveBarColor = getOptionValue(options.inactiveBarColor, Defaults.INACTIVE_BAR_COLOR);

		/**
		 * @public
		 * Inactive bar opacity 
		 */
		this._options.inactiveBarOpacity = getOptionValue(options.inactiveBarOpacity, Defaults.INACTIVE_BAR_OPACITY);

		/**
		 * @public
		 * Over bar color 
		 */
		this._options.overSelectionColor = getOptionValue(options.overSelectionColor, Defaults.OVER_SELECTION_COLOR);

		/**
		 * @public
		 * Over selection opacity 
		 */
		this._options.overSelectionOpacity = getOptionValue(options.overSelectionOpacity, Defaults.OVER_SELECTION_OPACITY);

		/**
		 * @public
		 * Selection color 
		 */
		this._options.selectionColor = getOptionValue(options.selectionColor, Defaults.SELECTION_COLOR);
		
		/**
		 * @public
		 * Enable selection toggle 
		 */
		this._options.enableSelectionToggle = getOptionValue(options.enableSelectionToggle, Defaults.ENABLE_SELECTION_TOGGLE);

		/**
		 * @public
		 * Font size
		 */
		this._options.fontSize = getOptionValue(options.fontSize, Defaults.FONT_SIZE);

		/**
		 * @public
		 * selection type
		 */
		this._options.selectionType = getOptionValue(options.selectionType, null);

		/**
		 * @public
		 * Color selections should be divided by vertical line. If null no divider is rendered.
		 */
		this._options.segmentDivider = getOptionValue(options.segmentDivider, null);

		/**
		 * @private
		 * observable handler
		 */
		this._observable = new Observable([
			/**
			 * @event 
			 * Fires when mouse is over a selection
			 * @param {int} selectionIndex
			 */
			"selectionOver",
			/**
			 * @event 
			 * Fires when selection is toggled
			 * @param {int} selectionIndex
			 * @param {bool} enabled
			 * @param {MouseEvent} browser event
			 */
			"toggleSelection",
			/**
			 * @event 
			 * Fires when selection is toggled
			 * @param {int} selectionIndex
			 * @param {bool} enabled
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

		/**
		 * @private
		 * histogramRenderer
		 */
		this._histogramRenderer = new HistogramRenderer(this._options);

		this._histogramRenderer.on("selectionOver", selectionIndex=>{
			this._observable.fire("selectionOver", selectionIndex);
		})

		this._histogramRenderer.on("toggleSelection", (selectionIndex, enabled)=>{
			this._observable.fire("toggleSelection", selectionIndex, enabled, d3.event);
		})

		this._histogramRenderer.on("selectionChanged", (selection)=>{
			this._observable.fire("selectionChanged", selection);
		})

		this._histogramRenderer.on("handleClick", (handleIndex, handleValue)=>{
			this._observable.fire("handleClick", handleIndex, handleValue);
		});
		
		this._selectionFactory = new HistogramSelectionFactory(this._options);
	}

	/**
	 * Bind widget event
	 * @param {String} event event name
	 * @param {Function} handler event handler
	 * @returns {Histogram} returns this widget instance
	 */
	on(eventName, handler) {
		this._observable.on(eventName, handler);
		return this;
	}

	/**
	 * Unbind widget event
	 * @param {String} event event name
	 * @param {Function} [handler] event handler
	 * @returns {Histogram} returns this widget instance
	 */
	off(eventName, handler) {
		this._observable.off(eventName, handler);
		return this;
	}	

	/**
	 * Destroys widget
	 * @returns {Histogram} returns this widget instance
	 */
	destroy() {
		this._observable.destroy();
		this._histogramRenderer.destroy();
		this._options = null;

		return this;
	}	

	/**
	 * Render logic of this widget
	 * @param {String|DOMElement} selector selector or DOM element 
	 * @returns {Histogram} returns this widget instance
	 */
	render(selector) {
		this._histogramRenderer.render(selector);
		return this;
	}

	/**
	 * Sets widget data
	 * @param {Array} data
	 * @param {Array} selection
	 * @param {Object} set data options
	 * @returns {Histogram} returns this widget instance 
	 */
	setData(data, selection, options) {
		if (!this._histogramRenderer.isRendered()) {
			throw "Can't call setData() when widget is not rendered, please call .render() first."
		}

		var histogramData = this._histogramData = new HistogramData(data, this._options);
		var histogramSelection = this._histogramSelection = this._selectionFactory.getHistogramSelection(selection, histogramData);

		this._options.selection = histogramSelection.getSelection();
		this._selection = selection;

		if (!this._options.format) {
			this._options.format = (value => String(value));
		} else if (typeof this._options.format == "string"){
			this._options.format = d3.format(this._options.format);
		}

		this._histogramRenderer.refresh(histogramData, histogramSelection, options);

		return this;
	}
	
	/**
	 * @public
	 * Sets selection type
	 * @param {String} selectionType
	 * @returns {Histogram} returns this widget instance 
	 */
	setSelectionType(selectionType){
		this._options.selectionType = selectionType;
		this.setSelection(this._selection);
		return this;
	}

	/**
	 * Shows selection labels
	 */
	showSelectionLabels(){
		this._histogramRenderer.showSelectionLabels();
	}

	/**
	 * Hides selection labels
	 */
	hideSelectionLabels(){
		this._histogramRenderer.hideSelectionLabels();
	}

	/**
	 * @deprecated use setSelection instead
	 */
	updateSelection(selection, options) {
		return this.setSelection(selection, options);
	}
	
	/**
	 * @public
	 * Sets selection
	 * @param {Array} selection
	 * @param {Object} options
	 * @returns {Histogram} returns this widget instance 
	 */
	setSelection(selection, options) {
		if (!this._histogramRenderer.isRendered()) {
			throw "Can't call setData() when widget is not rendered, please call .render() first."
		}

		if (!this._histogramData) {
			throw "Can't call setSelection() when no data is available."
		}
		// Do not want to mutate given object
		const selectionCopy = JSON.parse(JSON.stringify(selection));
		var histogramSelection = this._histogramSelection = this._selectionFactory.getHistogramSelection(selectionCopy, this._histogramData);
		this._options.selection = histogramSelection.getSelection();
		this._selection = selectionCopy;
		this._histogramRenderer.setSelection(this._histogramSelection, options);

		return this;
	}

}

Histogram.SelectionTypes = SelectionTypes;
export default Histogram;
