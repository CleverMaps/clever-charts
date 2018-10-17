import FilterHistogramSelectionImpl from "./FilterHistogramSelectionImpl";
import {SelectionTypes} from "./HistogramSelection";

/**
 * @class
 * MultipleHistogramSelection representing histogram selection that support multiple selections
 */
export default class InvertedFilterHistogramSelectionImpl extends FilterHistogramSelectionImpl {
	/**
	 * @param {HistogramData} histogramData
	 * @param {Array} selection
	 */
    constructor(histogramData, selection) {
		super(histogramData, selection);

		this._selection = this._getInvertedSelection(histogramData, selection);
    }


	_getInvertedSelection(histogramData, selection){
		var minMax = histogramData.getMinMax();

		var invertedSelection = [
			{
				from:minMax.min,
				to:selection[0].from
			},
			{
				from:selection[0].from,
				disabled:true,
				to:selection[0].to
			},
			{
				from:selection[0].to,
				to:minMax.max
			}
		];

		return this.getSelectionWithPositions(histogramData, invertedSelection);
	}

	/**
	 * @public
	 * @returns {Array} histogram selection
	 * @implements HistogramSelection.getOutputSelection()
	 * Returns histogram selection 
	 */
	getOutputSelection(){
		return [
			{
				from:this._selection[1].from,
				to:this._selection[1].to
			}
		];
	}	

	/**
	 * @public
	 * @implements HistogramSelection.getSelectionType()
	 * Returns histogram selection
	 */
	getSelectionType(){
		return SelectionTypes.INVERTED_FILTER;
	}

	/**
	 * @public 
	 * @implements HistogramSelection.getSelectionPoints()
	 * Returns histogram selection points
	 */
	getSelectionPoints(){
		var result = super.getSelectionPoints();
		
		result[0].hidden = true;
		result[result.length-1].hidden = true;

		return result;
	}  	
}