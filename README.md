# CleverCharts

Simple javascript charts suited for BI applications

## Changelog

### 1.2.14 > 1.2.15

Add histogram config option to adjust y axis max height

### 1.2.13 > 1.2.14

Adjust highlight yellow color

### 1.2.12 > 1.2.13

Add more barchart configuration options:
* stripeHeight: height of stripe
* detailsBottomSpace: vertical space between details (label and tooltip) and stripe
* horizontalPadding: padding around details (label and tooltip)
* showLabelCircle: new option to display additional circle with bar color. Useful for charts with more colors

### 1.2.11 > 1.2.12

Set fixed width of linechart label gradient
Render linechart label group only after annotations and lines group
Add option enableLineTooltip for linechart

### 1.2.10 > 1.2.11

Add only tool in Barchart

### 1.2.9 > 1.2.10

Add default top margin in Linechart

### 1.2.8 > 1.2.9

Fix bug when rendering Linechart into display-none element

### 1.2.7 > 1.2.8

Linechart bugfixes
 * Multiple times setData call
 * first/last null value in data
 * Unpresent value id in annotation
 * Bottom label mask at edge positions
 * Single value label
 * Destroy call throws an error
 * Typo
Linechart tooltip does not overflow top line.

### 1.2.6 > 1.2.7

Add new component Linechart
 * Adds support for line hover and line tooltip
 * Adds support for annotations
 * Consumes different data format
 * Fixes bug with all negative values
Deprecate component Line

### 1.2.4 > 1.2.6

Add support for histogram segment icons and divider
Add related examples

### 1.2.3 > 1.2.4

Do not clear selection when selection is set
Deprecate histogram updateSection

### 1.2.2 > 1.2.3

Add support of updating histogram selection without refreshing
So handlers are not affected. See example of use

### 1.2.1 > 1.2.2

Fix selection changes in inverted histogram filter

### 1.2.0 > 1.2.1

Handle long labels on barchart

### 1.1.3 > 1.2.0

Break backwards compatibility of Barchart component
There was deprecated class 'Bar' and new class 'Barchart'. Now only 'Barchart' exists
It has more features (see examples/bar.html)
Consumes different format of data (see examples/data/bar/*.json)

