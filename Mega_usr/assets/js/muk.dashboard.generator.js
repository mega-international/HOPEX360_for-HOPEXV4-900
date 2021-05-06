var MgsDashboardUtility = {

	bLogError:true,

	logError:function(message, error){
		if (MgsDashboardUtility.bLogError){
			console.log({"message":message,"error":error});
		}
	},

	isElement: function(o){
		return (
		  typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
		  o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	  );
	},

	getDateFormatSlash: function(date){
		var valueDate = date;
		var valueYYYY = "" + valueDate.getFullYear();
		var valueMM = (valueDate.getMonth()+1)<10?"0"+(valueDate.getMonth()+1):""+(valueDate.getMonth()+1);
		var valueDD = valueDate.getDate()<10?"0"+valueDate.getDate():""+valueDate.getDate();
		return valueYYYY + "/" + valueMM + "/" + valueDD;
	},

	getDateFormatDash: function(date){
		var valueDate = date;
		var valueYYYY = "" + valueDate.getFullYear();
		var valueMM = (valueDate.getMonth()+1)<10?"0"+(valueDate.getMonth()+1):""+(valueDate.getMonth()+1);
		var valueDD = valueDate.getDate()<10?"0"+valueDate.getDate():""+valueDate.getDate();
		return valueYYYY + "-" + valueMM + "-" + valueDD;
	},

	getColorBasedOnBackgroundColor: function(bgColor, darkColor, lightColor) {
		var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
		var r = parseInt(color.substring(0, 2), 16); // hexToR
		var g = parseInt(color.substring(2, 4), 16); // hexToG
		var b = parseInt(color.substring(4, 6), 16); // hexToB
		return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
		  darkColor : lightColor;
	},


	getInterpolatedColorsFromScheme: function (colorScheme, iNumberOfValues) {
		var colors = [];
		if (colorScheme.length >= iNumberOfValues) {
			for (var i = 0; i < colorScheme.length; i++) {
				colors.push(colorScheme[i]);
			}
			return colors;
		}

		var iColorPairs = colorScheme.length - 1;
		if (iColorPairs < 1) {
			if (colorScheme.length === 0) colorScheme.put("#ffffff");
			for (var i = 0; i < iNumberOfValues; i++) {
				colors.push(colorScheme[0]);
			}
			return colors;
		}
		var iRemColorsPerPair = iNumberOfValues % iColorPairs;
		var iColorsPerPair = (iNumberOfValues - iRemColorsPerPair) / iColorPairs;

		for (var i = 0; i < iColorPairs; i++) {
			var iColorsPerThisPair = iColorsPerPair + iRemColorsPerPair;
			iRemColorsPerPair = (iRemColorsPerPair > 0) ? iRemColorsPerPair - 1 : 0;
			for (var j = 0; j < iColorsPerThisPair; j++) {
				if (i === 0 && j === 0) {
					colors.push(d3.interpolateRgb(colorScheme[i], colorScheme[i + 1])(0));
					continue;
				}
				var dFraction = (1 / iColorsPerThisPair) * (j + 1);
				colors.push(d3.interpolateRgb(colorScheme[i], colorScheme[i + 1])(dFraction));
			}
		}
		return colors;
	},

	getObjectsByValueFromLogic: function(objects, logic){
		var values = [];
		for ( var i = 0; i < objects.length; i++){
			var object = objects[i];
			var objectValues = MgsDashboardUtility.getObjectValuesFromLogic(object, logic);
			if (objectValues.length === 0) objectValues.push("[Empty]");
			for (var j = 0; j < objectValues.length; j++){
				var objectValue = objectValues[j];
				if (Array.isArray(objectValue)){

				}else{
					var bFound = false;
					for (var k = 0; k < values.length; k++){
						var value = values[k];
						var name = (objectValue.value)?objectValue.value:objectValue;
						if (value.name === name){
							var bFoundObject = false;
							for (var l = 0; l < value.objects.length; l++){
								var objectToCheck = value.objects[l];
								if (objectToCheck.id === object.id){
									bFoundObject = true;
									break;
								}
							}
							if (!bFoundObject){
								value.objects.push(object);
							}
							bFound = true;
							
							break;
						}
					}
					if (!bFound){
						var value = {}
						value.name = (objectValue.value)?objectValue.value:objectValue;
						value.objects = [];
						value.objects.push(object);
						values.push(value);
					}
				}
			}
		}
		return values;
	},

	getObjectValuesFromLogic: function (object, logic, currentIndex, values, parentObjects, parentFields) {
		values = values ? values : [];
		logic.aFields = (logic.aFields) ? logic.aFields : logic.fields.split(".");
		var fields = logic.aFields;
		var currentObject = object;
		var index = (currentIndex) ? currentIndex : 0;
		for (var i = index; i < fields.length; i++) {
			if (currentObject !== null && currentObject[fields[i]]) {
				currentObject = currentObject[fields[i]];
				if (i == fields.length - 1) {
					var valueObject = {
						value:currentObject,
						object:object,
						field:fields[i],
						parentObjects:parentObjects,
						parentFields:parentFields
					}
					values.push(valueObject);
				}else if (Array.isArray(currentObject)) {
					parentObjects = (parentObjects)?parentObjects:[];
					parentFields = (parentFields)?parentFields:[];
					parentObjects = object;
					parentFields = fields[i];
					for (var j = 0; j < currentObject.length; j++) {
						MgsDashboardUtility.getObjectValuesFromLogic(currentObject[j], logic, i+1, values, parentObjects, parentFields);
					}
					return values;
				}
			} else {
				return values;
			}
		}
		return values;
	},

	prepareValuesForChart :function(values, iNumOfValues){
		values.sort(function(a,b){
			return  b.objects.length - a.objects.length;
		});
		if (values.length > iNumOfValues){
			valueToChange = values[iNumOfValues-1];
			valueToChange.name = "Others";
			for (var i = iNumOfValues; i < values.length; i++){
				for (var j = 0; j < values[i].objects.length; j++){
					var candidateToAdd = values[i].objects[j];
					var bFound = false;
					for (var k = 0; k < valueToChange.objects.length; k++){
						var objectToCompare = valueToChange.objects[k]
						if (objectToCompare.id == candidateToAdd.id){
							bFound = true;
							break;
						}
					
					}
					if (!bFound){
						valueToChange.objects.push(candidateToAdd);
					}
				}
			}
			while(values.length > iNumOfValues){
				values.pop();
			}
		}

	},

	getSubObjectsFromLogic: function (object, logic, currentIndex, values) {
		values = values ? values : [];
		if (!logic.fieldSubObjects) {
			values.push(object);
			return values;
		}
		logic.aFieldSubObjects = (logic.aFieldSubObjects) ? logic.aFieldSubObjects : logic.fieldSubObjects.split(".");
		var fields = logic.aFieldSubObjects;
		var currentObject = object;
		var index = (currentIndex) ? currentIndex : 0;
		for (var i = index; i < fields.length; i++) {
			if (currentObject !== null && currentObject[fields[i]]) {
				currentObject = currentObject[fields[i]];
				if (Array.isArray(currentObject)) {
					for (var j = 0; j < currentObject.length; j++) {
						MgsDashboardUtility.getSubObjectsFromLogic(currentObject[j], logic, i+1, values);
					}
					return values;
				} else if (i == fields.length - 1) {
					if (Array.isArray(currentObject)) {
						for (var j = 0; j < currentObject.length; j++) {
							if (!currentObject[j].id) continue;
							var bFound = false;
							for (var k = 0; k < values.length; k++) {
								if (values[k].id === currentObject[j].id) {
									bFound = true;
									break;
								}
							}
							if (!bFound && currentObject[j].classId && (!logic.classId || logic.classId.indexOf(currentObject[j].classId) > -1))
								values.push(currentObject[j]);
						}
					} else {
						if (currentObject.id && currentObject.classId && (!logic.classId || logic.classId.indexOf(currentObject.classId) > -1))
							values.push(currentObject);
					}
				}
			} else {
				return values;
			}
		}
		if (index === fields.length){
			var bFound = false;
			for (var k = 0; k < values.length; k++) {
				if (values[k].id === currentObject.id) {
					bFound = true;
					break;
				}
			}
			if (!bFound && (!logic.classId || (currentObject[j].classId && (logic.classId.indexOf(currentObject[j].classId) > -1) ) ) ){
				values.push(currentObject);
			}
		}
		return values;
	},

	processLogic: function (object, logic, currentDate) {
		if (logic.valueIsCurrentDate || (typeof logic.value == "string" && logic.value.toLowerCase() == "&currentdate")){
			currentDate = currentDate?currentDate:new Date();
			logic.value = MgsDashboardUtility.getDateFormatSlash(currentDate);
			logic.valueIsCurrentDate = true;
		}
		var values = MgsDashboardUtility.getObjectValuesFromLogic(object, logic);
		if (!Array.isArray(values)) {
			var vs = [];
			vs.push(values);
			values = vs;
		}

		var bPassedTests = false;
		for (var i = 0; i < values.length; i++) {
			var valueObject = values[i];
			var value = valueObject.value;
			var bTest = MgsDashboardUtility.testLogic(object, logic, value);

			if (logic.trueForAll) {
				if (!bTest) return false;
			}else if (!logic.keepSubElements){
				
				if (bTest){
					bPassedTests = true;
				} else{
					//we remove the elements that fail the test
					MgsDashboardUtility.cleanParentObjects(valueObject);

				}
			}
			else {
				if (bTest) return true;
			}

		}
		if (logic.trueForAll) {
			return true;
		}
		return bPassedTests;
	},

	testLogic:function(object, logic, value){
		var bTest = false;
		var testValue = (value)?(Array.isArray(value))?value.length:value:null;
		try{
			if (logic.operator === "==") { //equals
				bTest = (testValue === logic.value);
			} else if (logic.operator === "!=") { //not equal
				bTest = (testValue !== logic.value);
			} else if (logic.operator === "<=") { //less than (inclusive)
				bTest = (testValue <= logic.value);
			} else if (logic.operator === "<") { //less than (exclusive)
				bTest = (testValue < logic.value);
			} else if (logic.operator === ">=") { //greater than (inclusive)
				bTest = (testValue >= logic.value);
			} else if (logic.operator === ">") { //greater than (exclusive)
				bTest = (testValue > logic.value);
			} else if (logic.operator === ">=<") { //between (inclusive)
				bTest = (testValue >= logic.value[0] && testValue <= logic.value[1]);
			} else if (logic.operator === "><") { //between (exclusive)
				bTest = (testValue > logic.value[0] && testValue < logic.value[1]);
			} else if (logic.operator === "<=>") { //outside (inclusive)
				bTest = (testValue <= logic.value[0] || testValue >= logic.value[1]);
			} else if (logic.operator === "<>") { //outside (exclusive)
				bTest = (testValue < logic.value[0] || testValue > logic.value[1]);
			} else if (logic.operator === "=#=") { //contains
				bTest = (testValue.indexOf(logic.value) > -1);
			} else if (logic.operator === "=#") { //begins with
				bTest = (testValue.indexOf(logic.value) === 0);
			} else if (logic.operator === "#=") { //ends with
				bTest = (testValue.indexOf(logic.value) === (testValue.length - logic.value.length));
			} else if (logic.operator === "{}") { //function
				if (!logic.operator._fn) logic.operator._fn = new Function(logic.operator.fn);
				bTest = logic.operator._fn(object, logic);
			}
		} catch (e) {
			MgsDashboardUtility.logError("Error occurred testing value", e);
		}
		return bTest;
	},

	cleanParentObjects: function(valueObject){
		if (valueObject.parentObjects && valueObject.parentFields && valueObject.parentObjects.length === valueObject.parentFields.length){
			var parentObject = valueObject.parentObjects[valueObject.parentObjects.length-1];
			var parentField = valueObject.parentFields[valueObject.parentFields.length-1];
			var childObject = valueObject.object;
			var idx = parentObject[parentField].indexOf(childObject);
			if (idx > -1) delete parentObject[parentField][idx];
			for (var i = valueObject.parentObjects.length -2; i > 0; i--){
				parentObject = valueObject.parentObjects[i];
				parentField = valueObject.parentFields[i];
				childObject = valueObject.parentObjects[i+1];
				if (!Arrays.isArray(parentObject[parentField])) continue;
				if (parentObject[parentField].length > 0) break;
				idx = parentObject[parentField].indexOf(childObject);
				if (idx > -1) delete parentObject[parentField][idx];
			}
		}
	}

}


function MgsDashboard(container, options, data) {
	var self = this;
	var isLoaded = false;
	var _defaultOptions = {
		//colorScheme: ["#5aa972", "#F4C557", "#d94153"],
		defaultDrillDown: "object-list",
		defaultBottomMargin: "20px",
		chartAspectRatio:1.5,
		colorScheme: [ "#5aa972", "#efd777", "#d94153", "#4ba2bb", "#f4c557", "#ef9035", "#c557f4", "#525174", "#764248", "#a2bb4b"]
	}

	function copyData() {
		var d = (self.data) ? JSON.parse(JSON.stringify(self.data)) : {};
		return d;
	}


	function applyFilters(changedFilter) {


		//Take a copy of the source data
		self.filteredData = copyData();

		//Filter the data on the changed filter first
		if (changedFilter) changedFilter.applyFilter();

		//Update Filter Data and apply Filters on remaining filters
		var f = self.filters;
		for (var i = 0; i < f.length; i++) {
			if (changedFilter && changedFilter.id === f[i].id) continue;
			f[i].updateData();
			f[i].applyFilter();
		}

		//Update Data for buttons
		var b = self.buttons;
		for (var i = 0; i < b.length; i++) {
			b[i].updateData();
		}

		//Update data for Charts
		var c = self.charts;
		for (var i = 0; i < c.length; i++) {
			c[i].updateData();
		}
	}

	function displayDrilldown(control, data, extraText, logic) {
		var type = (control.options) ? (control.options.drillDown) ? control.options.drillDown.type : self.options.defaultDrillDown : self.options.defaultDrillDown;
		var id = (control.options) ? (control.options.drillDown) ? control.options.drillDown.id : self.options.defaultDrillDown : self.options.defaultDrillDown;
		var abort = (control.options) ? (control.options.noDrillDown) ? true : false : false;
		if (!type || !id || abort) return;

		var drillDownToDisplay;
		for (var i = 0; i < self.drillDowns.length; i++) {
			var drillDown = self.drillDowns[i];
			drillDown.hide();
			if (drillDown.type === type && drillDown.id === id) drillDownToDisplay = drillDown;
		}
		if (drillDownToDisplay) drillDownToDisplay.display(data, control, extraText, logic);
	}

	function loadData() {
		if (!self.data) {
			var xmlhttp = new XMLHttpRequest();
			var url = self.dataURL;
			xmlhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					self.data = JSON.parse(this.responseText);
					loadData();
				}
			};
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
			return;
		}
		applyFilters();
	}


	function initFilters() {

		self.filters = [];

		// Check filters are specified in options
		var f = self.options.filters;
		if (!f || !Array.isArray(f)) return;


		//Create HTML element container for filters
		self.eFiltersContainer = document.createElement("div");
		self.eFiltersContainer.classList.add("dbd-filters");
		self.eFiltersContainer.classList.add("row");
		self.eFiltersContainer.classList.add("justify-content-start");
		self.eContainer.appendChild(self.eFiltersContainer);

		//Test Current Date
		//var dateF = {
		//	type:"current-date",
		//	label:"Current Date"
		//}
		//var datefilter = new MgsDashboardFilter(self, dateF, applyFilters);
		//self.filters.push(datefilter);
		//End Test

		//Initialise filters
		for (var i = 0; i < f.length; i++) {
			if (!f[i].id) f[i] = "dashboardfilter_" + i;
			var filter = new MgsDashboardFilter(self, f[i], applyFilters);
			self.filters.push(filter);
		}

	}

	function initButtons() {

		self.buttons = [];

		// Check Buttons are specified in options
		var b = self.options.buttons;
		if (!b || !Array.isArray(b)) return;


		//Create HTML element container for buttons
		self.eButtonsContainer = document.createElement("div");
		self.eButtonsContainer.classList.add("dbd-buttons");
		self.eButtonsContainer.classList.add("row");
		self.eButtonsContainer.classList.add("justify-content-start");
		self.eContainer.appendChild(self.eButtonsContainer);

		var colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, b.length);
		//Initialise buttons
		for (var i = 0; i < b.length; i++) {
			b[i].id = (b[i].id)?b[i].id:"dashboardbutton_" + i;
			b[i].color = (b[i].color)?b[i].color:colors[i];
			var btn = new MgsDashboardButton(self, b[i], displayDrilldown);
			self.buttons.push(btn);
		}


	}

	function initCharts() {

		self.charts = [];

		// Check charts are specified in options
		var c = self.options.charts;
		if (!c || !Array.isArray(c)) return;


		//Create HTML element container for charts
		self.eChartsContainer = document.createElement("div");
		self.eChartsContainer.classList.add("dbd-charts");
		self.eChartsContainer.classList.add("row");
		self.eContainer.appendChild(self.eChartsContainer);


		//Initialise charts
		for (var i = 0; i < c.length; i++) {
			if (!c[i].id) c[i] = "dashboardchart_" + i;
			var chart = new MgsDashboardChart(self, c[i], displayDrilldown);
			self.charts.push(chart);
		}


	}

	function initDrillDown() {
		self.drillDowns = [];

		// Check drilldowns are specified in options
		var d = self.options.drillDowns;
		if (!d || !Array.isArray(d)) {
			d = [];

		}


		//Create HTML element container for filters
		self.eDrillDownsContainer = document.createElement("div");
		self.eDrillDownsContainer.classList.add("dbd-drilldowns");
		//self.eDrillDownsContainer.classList.add("row");
		//self.eDrillDownsContainer.classList.add("modal");
		//self.eDrillDownsContainer.classList.add("fade");
		self.eContainer.appendChild(self.eDrillDownsContainer);

		//Initialise Default drillDown
		var defaultDrillDownOptions = {
			id:self.options.defaultDrillDown,
			type:self.options.defaultDrillDown
		}
		//var defaultDrillDown = new MgsDashboardDrillDown(self, defaultDrillDownOptions);
		d.push(defaultDrillDownOptions);

		//Initialise drillDowns
		for (var i = 0; i < d.length; i++) {
			if (!d[i].id) d[i] = "dashboarddrilldown_" + i;
			var drillDown = new MgsDashboardDrillDown(self, d[i]);
			self.drillDowns.push(drillDown);
			drillDown.hide();
		}

	}

	function loadOptions(options) {
		self.options = JSON.parse(JSON.stringify(_defaultOptions));
		var keys = Object.keys(options);
		for (var i = 0; i < keys.length; i++) {
			self.options[keys[i]] = options[keys[i]];
		}
	}


	function init(container, options, data) {
		self.currentDate = new Date();
		self.eParentContainer = container;
		if (container && MgsDashboardUtility.isElement(container)) {
			self.eContainer = document.createElement("div");
			self.eParentContainer.appendChild(self.eContainer);
		} else {
			throw new Error("Unable to create chart. Invalid container Element provided.");
		}

		loadOptions(options);
		self.data = self.options.data;
		self.dataURL = self.options.dataURL;
		initFilters();
		initButtons();
		initCharts();
		initDrillDown();
		loadData();
		isLoaded = true;
	}

	//Auto Initialise
	try {
		init(container, options, data);
	} catch (e) {
		MgsDashboardUtility.logError("Error occurred initialising dashboard", e);
		throw e;
	}
}

function MgsDashboardFilter(dashboard, options, callback) {
	var self = this;
	var isLoaded = false;

	self.applyFilter = function () {
		if (!isLoaded) return;
		self.renderer.applyFilter();
	}

	self.updateData = function () {
		if (!isLoaded) return;
		self.renderer.updateData();
	}

	// Initialise the DashboardFilter
	function init(dashboard, options, callback) {

		self.dashboard = dashboard;
		self.eParentContainer = dashboard.eFiltersContainer;
		self.options = options;
		self.id = options.id;
		self.type = options.type;
		self.callback = callback;

		self.eOuterContainer = document.createElement("div");
		self.eOuterContainer.classList.add("col-md-4");
		self.eOuterContainer.classList.add("col-lg-4");
		self.eOuterContainer.classList.add("col-xl-3");
		self.eOuterContainer.style.marginBottom = dashboard.options.defaultBottomMargin;
		self.eParentContainer.appendChild(self.eOuterContainer);
		
		self.eContainer = document.createElement("div");
		self.eContainer.classList.add("card");
		self.eContainer.style.border = "none";
		//self.eContainer.classList.add("shadow-sm");
		self.eOuterContainer.appendChild(self.eContainer);

		// Initialise the DashboardFilter Renderer
		var renderer = self.type ? MgsDashboardFilterRenderers[self.type] : null;
		if (renderer) {
			try {
				self.renderer = Object.create(renderer.prototype);
				renderer.call(self.renderer, self);
			} catch (e) {
				throw (e);
			}
		} else {
			throw new Error("Unable to create filter. No renderer for the type " + type + " is defined.");
		}
		isLoaded = true;
	}

	//Auto Initialise
	try {
		init(dashboard, options, callback);
	} catch (e) {
		throw e;
	}
}

function MgsDashboardButton(dashboard, options, callback) {
	var self = this;
	var isLoaded = false;

	self.updateData = function () {
		if (!isLoaded) {
			console.log("Unable to update button as it was not initialised correctly.");
			return;
		}
		self.renderer.updateData();
	}

	// Initialise the DashboardButton
	function init(dashboard, options, callback) {

		self.dashboard = dashboard;
		self.eParentContainer = dashboard.eButtonsContainer;
		self.options = options;
		self.type = options.type;
		self.callback = callback;

		self.eOuterContainer = document.createElement("div");
		self.eOuterContainer.classList.add("col-md-6");
		self.eOuterContainer.classList.add("col-lg-3");
		self.eOuterContainer.classList.add("col-xl-2");
		self.eOuterContainer.style.marginBottom = dashboard.options.defaultBottomMargin;
		self.eOuterContainer.style.minWidth = "200px";
		self.eParentContainer.appendChild(self.eOuterContainer);
		
		self.eContainer = document.createElement("div");
		self.eContainer.classList.add("card");
		self.eContainer.classList.add("h-100");
		self.eContainer.style.border = "none";
		//self.eContainer.classList.add("shadow-sm");
		self.eOuterContainer.appendChild(self.eContainer);

		// Initialise the DashboardFilter Renderer
		var renderer = self.type ? MgsDashboardButtonRenderers[self.type] : null;
		if (renderer) {
			try {
				self.renderer = Object.create(renderer.prototype);
				renderer.call(self.renderer, self);
			} catch (e) {
				throw (e);
			}
		} else {
			throw new Error("Unable to create filter. No renderer for the type " + self.type + " is defined.");
		}
		isLoaded = true;
	}

	//Auto Initialise
	try {
		init(dashboard, options, callback);
	} catch (e) {
		throw e;
	}
}


function MgsDashboardChart(dashboard, options, callback) {

	var self = this;
	var isLoaded = false;

	self.updateData = function () {
		if (!isLoaded) {
			console.log("Unable to update as chart was not initialised correctly.");
			return;
		}
		self.renderer.updateData();
	}

	var isElement = function (element) {
		return element instanceof Element || element instanceof HTMLDocument;
	}


	//Initialise the DashboardChart.
	function init(dashboard, options, callback) {

		self.dashboard = dashboard;
		self.eParentContainer = dashboard.eChartsContainer;
		self.options = options;
		self.type = options.type;
		self.callback = callback;

		self.eOuterContainer = document.createElement("div");
		if (self.dashboard.options.chartDisplaySingleMode){
			self.eOuterContainer.classList.add("col-12");
		}else{
			self.eOuterContainer.classList.add("col-md-12");
			self.eOuterContainer.classList.add("col-lg-6");
			self.eOuterContainer.classList.add("col-xl-4");
		}
		self.eOuterContainer.style.marginBottom = dashboard.options.defaultBottomMargin;
		self.eOuterContainer.style.minWidth = "400px";
		//self.eOuterContainer.style.maxWidth = "700px";
		self.eParentContainer.appendChild(self.eOuterContainer);
		
		self.eContainer = document.createElement("div");
		self.eContainer.classList.add("card-chart");
		self.eContainer.classList.add("shadow-sm");
		self.eOuterContainer.appendChild(self.eContainer);

		var renderer = self.type ? MgsDashboardChartRenderers[self.type] : null;
		if (renderer) {
			try {
				self.renderer = Object.create(renderer.prototype);
				renderer.call(self.renderer, self);
			} catch (e) {
				throw (e);
			}
		} else {
			throw new Error("Unable to create chart. No renderer for the type " + self.type + " is defined.");
		}
		isLoaded = true;
	}

	//Auto Initialise DashboardChart
	try {
		init(dashboard, options, callback);
	} catch (e) {
		throw e;
	}
}


function MgsDashboardDrillDown(dashboard, options) {

	var self = this;
	var isLoaded = false;

	self.hide = function () {
		self.eOuterContainer.style.display = "none";
	}

	self.display = function (data, control, extraText, logic) {
		var label = (control.options) ? (control.options.name) ? control.options.name : "Items" : "Items";
		self.eOuterContainer.style.display = "block";
		self.renderer.display(data, label, extraText, logic);
	}

	var isElement = function (element) {
		return element instanceof Element || element instanceof HTMLDocument;
	}


	//Initialise the DashboardDrillDown.
	function init(dashboard, options) {
		self.dashboard = dashboard;
		self.eParentContainer = dashboard.eDrillDownsContainer;
		self.options = options;
		self.type = options.type;
		self.id = options.id;

		self.eOuterContainer = document.createElement("div"); 
		self.eOuterContainer.classList.add("modal");
		self.eOuterContainer.style.marginBottom = dashboard.options.defaultBottomMargin;
		self.eParentContainer.appendChild(self.eOuterContainer);
			
		self.eContainer = document.createElement("div");
		// self.eContainer.classList.add("card");
		self.eContainer.classList.add("modal-dialog-centered");
		self.eContainer.classList.add("shadow-sm");
		self.eOuterContainer.appendChild(self.eContainer);

		var renderer = self.type ? MgsDashboardDrillDownRenderers[self.type] : null;
		if (renderer) {
			try {
				self.renderer = Object.create(renderer.prototype);
				renderer.call(self.renderer, self);
			} catch (e) {
				throw (e);
			}
		} else {
			throw new Error("Unable to create drilldown. No renderer for the type " + self.type + " is defined.");
		}
		isLoaded = true;
	}

	//Auto Initialise DashboardDrillDown
	try {
		init(dashboard, options);
	} catch (e) {
		throw e;
	}


}

var MgsDashboardFilterRenderers = {

	"current-date": function (dashboardFilter) {
		var self = this;
		self.currentValue = null;
		self.dashboardFilter = dashboardFilter;
		self.options = self.dashboardFilter.options;
		self.eParentContainer = self.dashboardFilter.eContainer;
		self.eLabel = document.createElement("div");
		self.eLabel.innerText = self.options.label;
		self.eParentContainer.appendChild(self.eLabel);
		self.eDate = document.createElement("input");
		self.eDate.setAttribute("type","date");
		self.eParentContainer.appendChild(self.eDate);
		self.currentDate = dashboardFilter.dashboard.currentDate || new Date();
		self.eDate.value = MgsDashboardUtility.getDateFormatDash(self.currentDate);
		self.eDate.onchange = function () {
			var newDate = new Date(self.eDate.value);
			self.dashboardFilter.dashboard.currentDate = newDate;
			self.dashboardFilter.callback(self.dashboardFilter);
		}

		//Filter data
		self.applyFilter = function () {
			//nothing to do here as we set the dashboard current date on change event.
		}

		self.updateData = function () {
			// nothing to do here

		}
	},

	"select": function (dashboardFilter) {
		var self = this;
		dataStructure = [];
		self.currentValue = null;
		self.dashboardFilter = dashboardFilter;
		self.options = self.dashboardFilter.options;
		self.options.values = self.options.values || [];
		self.eParentContainer = self.dashboardFilter.eContainer;
		self.eLabel = document.createElement("div");
		self.eLabel.innerText = self.options.label;
		self.eParentContainer.appendChild(self.eLabel);
		self.eSelect = document.createElement("select");
		self.eParentContainer.appendChild(self.eSelect);
		self.eSelect.onchange = function () {
			self.currentValue = (self.eSelect.value && self.eSelect.value !== "") ? self.eSelect.value : null;
			if (self.currentValue === null) {
				self.currentOption = self.options.valueEmpty;
				dataStructure = [];
			} else {
				// console.log("self.currentValue select "+self.currentValue);
				for (var i = 0; i < self.options.values.length; i++) {
					// console.log("self.options.values[i].id "+self.options.values[i].id);
					if (self.options.values[i].id == self.currentValue && !self.options.datastructureSelect) {
						self.currentOption = self.options.values[i];
						// console.log("self.currentOption = self.options.values[i] TRUE " ));
						console.log("self.currentOption = self.options.values[i] TRUE " );
						break;
					}
					if (self.options.values[i].id == self.currentValue && self.options.datastructureSelect) {
						// self.currentOption = self.options.values[i];
						dataStructure = self.options.values[i]; 
						break;
					}
				}
			}
			self.dashboardFilter.callback(self.dashboardFilter);
		}


		//Filter data
		self.applyFilter = function () {
			var data = self.dashboardFilter.dashboard.filteredData;
			var filteredObjects = [];
			if (!self.currentValue || !data || !self.currentOption || !self.currentOption.logic) return;
			for (var j = 0; j < data.length; j++) {
				var object = data[j];
				var aLogic = Array.isArray(self.currentOption.logic)?self.currentOption.logic:[self.currentOption.logic];
				var bPassed = true;
				for (var i = 0; i < aLogic.length; i++) {
					var logic = aLogic[i];
					if (!MgsDashboardUtility.processLogic(object, logic, self.dashboardFilter.dashboard.currentDate)) {
						bPassed = false;
						break;
					}
				}
				if (bPassed) filteredObjects.push(object);
			}
			self.dashboardFilter.dashboard.filteredData = filteredObjects;
		}

		self.updateData = function () {
			var data;

		}

		self.options.valueEmpty = self.options.valueEmpty ? self.options.valueEmpty : { "id": "", "name": "Not Selected" };

		for (var i = -1; i < self.options.values.length; i++) {
			var value = (i < 0) ? self.options.valueEmpty : self.options.values[i];
			var eOption = document.createElement("option");
			eOption.value = value.id;
			eOption.text = value.name;
			self.eSelect.appendChild(eOption);
		}

	}

}

var MgsDashboardButtonRenderers = {
	"object-count": function (dashboardButton) {
		var self = this;
		var data;
		var objects = [];
		var _defaultOptions = {
			color: "#5aa972",
			fontColor: "#ffffff",
			collectionName: "Items",
		}
		
		
		self.updateData = function () {
			objects = [];
			data = self.dashboardButton.dashboard.filteredData;
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}
			self.eCount.innerText = objects.length;
			self.eLabel.innerText = self.options.label;
			self.eContainer.style.backgroundColor = self.options.color;
			self.eContainer.style.color = self.options.fontColor;
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboardButton.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardButton) {
			self.eParentContainer = dashboardButton.eContainer;

			self.eContainer = document.createElement("div");
			self.eContainer.classList.add("card-body");
			self.eContainer.style.cursor = "pointer";
			self.eContainer.style.padding = ".5rem";
			self.eContainer.style.textAlign = "center";
			self.eParentContainer.appendChild(self.eContainer);

			self.eCount = document.createElement("h4");
			self.eCount.classList.add("card-title");
			self.eCount.style.display = "inline-block";
			self.eCount.style.marginRight = ".25em";
			self.eCount.style.marginBottom =  "0px";
			self.eContainer.appendChild(self.eCount);

			self.eLabel = document.createElement("span");
			self.eLabel.style.fontWeight =  "bold";
			self.eContainer.appendChild(self.eLabel);

			self.dashboardButton = dashboardButton;

			loadOptions(dashboardButton.options);

			self.eContainer.onclick = function(){
				self.dashboardButton.callback(self.dashboardButton, objects);
			}

		}

		//Auto Initislise Renderer
		try {
			init(dashboardButton);
		} catch (e) {
			throw e;
		}



	},

	"hyper-link": function (dashboardButton) {
		var self = this;
		self.updateData = function () {
			var data;

		}

	}
}

var MgsDashboardChartRenderers = {

	"heat-matrix": function (dashboardChart) {
		var self = this;
		var matrix, ctx;
		var data;
		var objects;
		var _defaultOptions = {
			colorScheme: ["#5aa972", "#F4C557", "#d94153"]
		}

		function isValidObject(object) {

		}

		function getXValue(object) {
			var logic = self.options.x.logic;
			var values = MgsDashboardUtility.getObjectValuesFromLogic(object, logic);
			return (Array.isArray(values) && values[0] && values[0].value) ? values[0].value : null;
		}

		function getYValue(object) {
			var logic = self.options.y.logic;
			var values = MgsDashboardUtility.getObjectValuesFromLogic(object, logic);
			return (Array.isArray(values) && values[0] && values[0].value) ? values[0].value : null;
		}

		self.updateData = function () {
			var dataset = matrix.data.datasets[0];
			if (!self.options.colors){
				var iNumberOfValues = (self.options.x.values.length)*(self.options.y.values.length);
				self.options.colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, iNumberOfValues);
			}

			dataset.data = [];
			objects = [];
			data = self.dashboardChart.dashboard.filteredData;
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}
			for (var i = 0; i < objects.length; i++) {
				var object = objects[i];
				//if (!isValidObject(object)) continue;
				var x = getXValue(object);
				var y = getYValue(object);
				if (!x || !y || self.options.x.values.indexOf(x)===-1 || self.options.y.values.indexOf(y)===-1) continue;
				var bFound = false;
				for (j = 0; j < dataset.data.length; j++) {
					var dataItem = dataset.data[j];
					if (dataItem.x === x && dataItem.y === y) {
						dataItem.v++;
						dataItem.objects.push(object);
						bFound = true;
						break;
					}
				}
				if (!bFound) {
					var colorIndex = (self.options.x.values.indexOf(x)+1)*(self.options.y.values.indexOf(y)+1);
					var color = self.options.colors[colorIndex-1];
					var dataItem = {
						x: x,
						y: y,
						v: 1,
						c: color,
						objects: []
					}
					dataItem.objects.push(object);
					dataset.data.push(dataItem);
				}
			}
			for (var i = 0; i < self.options.x.values.length; i++) {
				var x = self.options.x.values[i];
				for (j = 0; j < self.options.y.values.length; j++) {
					var y = self.options.y.values[j];
					var bFound = false;
					for (k = 0; k < dataset.data.length; k++) {
						var dataItem = dataset.data[k];
						if (dataItem.x === x && dataItem.y === y) {

							bFound = true;
							break;
						}
					}
					if (!bFound) {
						var colorIndex = (i+1)*(j+1);
						var color = self.options.colors[colorIndex-1];
						var dataItem = {
							x: x,
							y: y,
							v: 0,
							c: color,
							objects: []
						}
						dataset.data.push(dataItem);
					}
				}
			}
			matrix.update();
		}

		function createMatrix() {
			ctx = self.eContainer.getContext("2d");
			matrix = new Chart(ctx, {
				type: 'matrix',
				data: {
					datasets: [{
						label: 'Matrix',
						data: [], //needs to be dynamic
						backgroundColor: function (ctx) {
							return ctx.dataset.data.length > 0?ctx.dataset.data[ctx.dataIndex].c:"#ffffff";
						},
						width: function (ctx) {
							var a = ctx.chart.chartArea;
							return ((a.right - a.left) / self.options.x.values.length) - 4; //number of rows
						},
						height: function (ctx) {
							var a = ctx.chart.chartArea;
							return ((a.bottom - a.top) / self.options.y.values.length) - 4; //number of cols
						}
					}]
				},
				options: {
					aspectRatio:self.dashboardChart.dashboard.options.chartAspectRatio,
					legend: {
						display: false
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = data.datasets[item.datasetIndex].data[item.index];
								return [self.options.x.label+": "+v.x,
										self.options.y.label+": "+v.y,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = matrix.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							if (this.data.datasets[0].data[selectedIndex].objects && this.data.datasets[0].data[selectedIndex].objects.length > 0){
								self.dashboardChart.callback(self.dashboardChart, this.data.datasets[0].data[selectedIndex].objects);
							}
						}
					},
					animation: {
						duration: 0,
						onProgress: function () {

							var ctx = this.chart.ctx;

							ctx.textAlign = "center";
							ctx.textBaseline = "bottom";
							ctx.fillStyle = this.chart.config.options.defaultFontColor;
							this.data.datasets.forEach(function (dataset) {
								for (var i = 0; i < dataset.data.length; i++) {
									var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model
									var item = dataset.data[i];
									ctx.font = Chart.helpers.fontString(model.height / 2, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
									ctx.fillText(item.v, model.x, model.y - (model.height / 2) + (model.height / 4));
								}
							})
						},
						onComplete: function () {

							var ctx = this.chart.ctx;

							ctx.textAlign = "center";
							ctx.textBaseline = "bottom";
							ctx.fillStyle = this.chart.config.options.defaultFontColor;
							this.data.datasets.forEach(function (dataset) {
								for (var i = 0; i < dataset.data.length; i++) {
									var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model
									var item = dataset.data[i];
									ctx.font = Chart.helpers.fontString(model.height / 2, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
									//position text
									ctx.fillText(item.v, model.x, model.y - (model.height / 2) + (model.height / 4));
								}
							})
						}
					},
					scales: {

						xAxes: [{
							type: 'category',
							labels: self.options.x.values, //need to be dynamic
							offset: true,
							position: 'top',
							scaleLabel: {
								display: true,
								labelString: self.options.x.label
							},
							ticks: {
								display: true
							},
							gridLines: {
								display: false
							}
						}],
						yAxes: [{
							type: 'category',
							labels: self.options.y.values, //need to be dynamic
							offset: true,
							scaleLabel: {
								display: true,
								labelString: self.options.y.label
							},
							ticks: {
								display: true

							},
							gridLines: {
								display: false
							}
						}]
					}
				}

			});
		}

		function loadOptions(options) {
			
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			
			loadOptions(dashboardChart.options);
			createMatrix();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"pie":  function (dashboardChart) {
		var self = this;
		var pie, ctx;
		var data;
		var drillDownData = {
			datasets:[
				{
					mgsData:[]
				}
			]
		};
		var objects;
		var _defaultOptions = {
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"],
			collectionName: "Items",
			legendDisplay:true,
			legendPosition:"right",
			maximumValues:9
		}

		function isValidObject(object) {

		}

		//TO UPDATE
		self.updateData = function () {
			var labels = [];
			var dataset = pie.data.datasets[0];
			var ddDataset = drillDownData.datasets[0];
			dataset.data = [];
			ddDataset.mgsData = [];
			data = self.dashboardChart.dashboard.filteredData;
			objects = [];
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}
			logic = (self.options.x.logic) ? self.options.x.logic : {};
			var values = MgsDashboardUtility.getObjectsByValueFromLogic(objects, logic);
			MgsDashboardUtility.prepareValuesForChart(values, self.options.maximumValues);
			self.options.colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, values.length);
			dataset.backgroundColor = self.options.colors;

			for (var i = 0; i < values.length; i++){
				var value = values[i];
				labels.push(value.name);
				dataset.data.push(value.objects.length);
				ddDataset.mgsData.push({
					"x":value.name,
					"v":value.objects.length,
					"objects":value.objects,
					"c":self.options.colors[i]
				});

			}
			pie.data.labels = labels;

			pie.update();
		}

		function createPie() {
			ctx = self.eContainer.getContext("2d");
			pie = new Chart(ctx, {
				type: 'pie',
				data: {
					labels: [],
					datasets: [{
						label: self.options.x.label,
						data: [], //needs to be dynamic
						mgsData: [],
						backgroundColor: function (ctx) {
							return drillDownData.datasets[0].mgsData.length > 0?drillDownData.datasets[0].mgsData[ctx.dataIndex].c:"#ffffff";
						}
					}]
				},
				options: {
					aspectRatio:self.dashboardChart.dashboard.options.chartAspectRatio,
					legend: {
						display: self.options.legendDisplay,
						position: self.options.legendPosition,
						labels: {
							usePointStyle: true
						}
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = drillDownData.datasets[item.datasetIndex].mgsData[item.index];
								return [data.datasets[item.datasetIndex].label+": "+v.x,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = pie.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							var textToSend = this.data.labels[selectedIndex];
							self.dashboardChart.callback(self.dashboardChart, drillDownData.datasets[0].mgsData[selectedIndex].objects, textToSend, self.options.x.logic);
						}
					},
					animation: {
						animateRotate: true,
						animateScale: true
					},
					plugins: {
						datalabels: {
							display: false
						}
					},
					responsive: true
				}
			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboardChart.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createPie();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"doughnut":  function (dashboardChart) {
		var self = this;
		var doughnut, ctx;
		var data;
		var drillDownData = {
			datasets:[
				{
					mgsData:[]
				}
			]
		};
		var objects;
		var _defaultOptions = {
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"],
			collectionName: "Items",
			legendDisplay:true,
			legendPosition:"right",
			maximumValues:9
		}

		function isValidObject(object) {

		}

		var legendClickHandler = function(e, legendItem) {
			var index = legendItem.index;
			var ci = this.chart;
			var datasetMeta = ci.getDatasetMeta(0);
			//var meta = ci.getDatasetMeta(index);
			var meta = datasetMeta.data[index];
		
			//meta.hidden = meta.hidden === null ? !meta.hidden : null;
			meta.hidden = meta.hidden === false ? true : false;

			var uniqueObjects = [];
			for (let i = 0; i < datasetMeta.data.length; i++) {
				if (!datasetMeta.data[i].hidden) {
					var objectsToCheck = drillDownData.datasets[0].mgsData[i].objects || [];
					for (var j=0; j < objectsToCheck.length; j++){
						var bFound = false;
						for (var k=0; k < uniqueObjects.length; k++){
							if (uniqueObjects[k].id == objectsToCheck[j].id){
								bFound = true;
								break;
							}
						}
						if (!bFound){
							uniqueObjects.push(objectsToCheck[j]);
						}
					}
					
				}
			}
			var totalObjects = uniqueObjects.length;
		
			ci.options.elements.center.text = totalObjects + '\n' + self.options.collectionName;
			
			// We hid a dataset ... rerender the chart
			ci.update();
		}

		//TO UPDATE
		self.updateData = function () {
			var labels = [];
			var dataset = doughnut.data.datasets[0];
			var ddDataset = drillDownData.datasets[0];
			dataset.data = [];
			ddDataset.mgsData = [];
			data = self.dashboardChart.dashboard.filteredData;
			objects = [];
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}
			logic = (self.options.x.logic) ? self.options.x.logic : {};
			var values = MgsDashboardUtility.getObjectsByValueFromLogic(objects, logic);
			MgsDashboardUtility.prepareValuesForChart(values, self.options.maximumValues);
			self.options.colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, values.length);
			dataset.backgroundColor = self.options.colors;
			var uniqueObjects = [];
			for (var i = 0; i < values.length; i++){
				var value = values[i];
				labels.push(value.name);
				dataset.data.push(value.objects.length);
				ddDataset.mgsData.push({
					"x":value.name,
					"v":value.objects.length,
					"objects":value.objects,
					"c":self.options.colors[i]
				});

				var objectsToCheck = value.objects || [];
				for (var j=0; j < objectsToCheck.length; j++){
					var bFound = false;
					for (var k=0; k < uniqueObjects.length; k++){
						if (uniqueObjects[k].id == objectsToCheck[j].id){
							bFound = true;
							break;
						}
					}
					if (!bFound){
						uniqueObjects.push(objectsToCheck[j]);
					}
				}
			}
			doughnut.data.labels = labels;
			doughnut.options.elements.center.text = uniqueObjects.length + "\n" + self.options.collectionName;

			doughnut.update();
		}

		function createDoughnut() {
			ctx = self.eContainer.getContext("2d");
			doughnut = new Chart(ctx, {
				type: 'doughnut',
				data: {
					labels: [],
					datasets: [{
						label: self.options.x.label,
						data: [], //needs to be dynamic
						mgsData: [],
						backgroundColor: function (ctx) {
							return drillDownData.datasets[0].mgsData.length > 0?drillDownData.datasets[0].mgsData[ctx.dataIndex].c:"#ffffff";
						}
					}]
				},
				options: {
					aspectRatio:self.dashboardChart.dashboard.options.chartAspectRatio,
					legend: {
						display: self.options.legendDisplay,
						position: self.options.legendPosition,
						labels: {
							usePointStyle: true
						},
						onClick:legendClickHandler
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = drillDownData.datasets[item.datasetIndex].mgsData[item.index];
								return [data.datasets[item.datasetIndex].label+": "+v.x,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = doughnut.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							var textToSend = this.data.labels[selectedIndex];
							self.dashboardChart.callback(self.dashboardChart, drillDownData.datasets[0].mgsData[selectedIndex].objects, textToSend, self.options.x.logic);
						}
					},
					animation: {
						animateRotate: true,
						animateScale: true
					},
					plugins: {
						datalabels: {
							display: false
						}
					},
					responsive: true,
					cutoutPercentage: 65,
					elements: {
						center: {
							text: "0\n" + self.options.collectionName,
							color: '#000000', //Default black
							fontStyle: 'Helvetica', //Default Arial
							sidePadding: 0 //Default 20 (as a percentage)
						}
					}
				},
				plugins:[
					{
						beforeDraw: function (chart, options) {
							if (chart.config.options.elements.center) {
								//Get ctx from string
								var ctx = chart.chart.ctx;
					
								//Get options from the center object in options
								var centerConfig = chart.config.options.elements.center;
								var fontStyle = centerConfig.fontStyle || 'Arial';
								var txt = centerConfig.text;
								var color = centerConfig.color || '#000';
								var sidePadding = centerConfig.sidePadding || 20;
								var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
								//Start with a base font of 30px
								var initialFontSize = centerConfig.initialFontSize || 30;
								ctx.font = Math.floor(initialFontSize/2) + "px " + fontStyle;
					
								//Get the width of the string and also the width of the element minus 10 to give it 5px side padding
								var stringWidth = ctx.measureText(txt).width;
								var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;
					
								// Find out how much the font can grow in width.
								var widthRatio = elementWidth / stringWidth;
								var newFontSize = Math.floor(initialFontSize * widthRatio);
								var elementHeight = (chart.innerRadius * 2);
					
								// Pick a new font size so it will not be larger than the height of label.
								var fontSizeToUse = Math.min(newFontSize, elementHeight);
					
								//Set font settings to draw it correctly.
								ctx.textAlign = 'center';
								ctx.textBaseline = 'middle';
								var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
								var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
								ctx.font = fontSizeToUse + "px " + fontStyle;
								ctx.fillStyle = color;
								var linesArray = txt.split('\n');
					
								if (linesArray.length % 2 === 0) {
									var topLimit = centerY - Math.floor(linesArray.length / 2) * fontSizeToUse * 0.5;
								} else {
									if (linesArray.length === 1) {
										var topLimit = centerY;
									} else {
										var topLimit = centerY - Math.floor(linesArray.length / 2) * fontSizeToUse +
											0.5;
									}
								}
					
								var currentY = topLimit;
					
								//Draw text in center
								linesArray.forEach(function (eachLine, lineIndex) {
									var finalFontSize = lineIndex !== 0 ? 0.5 * fontSizeToUse : fontSizeToUse;
									ctx.font = finalFontSize + "px " + fontStyle;
									ctx.fillText(eachLine, centerX, currentY);
									currentY = lineIndex === 0 ? currentY + finalFontSize * 1.1 * (lineIndex + 1) : currentY + finalFontSize * (lineIndex + 1);
					
								});
							}
						}
					}
				]
			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboardChart.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createDoughnut();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},


	"line": function (dashboardChart) {
		var self = this;
		var line, ctx;
		var data;
		var objects;
		var _defaultOptions = {
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"]
		}

		function isValidObject(object) {

		}

		//TO UPDATE
		self.updateData = function () {
			var dataset = line.data.datasets[0];
			dataset.data = [];
			line.update();
		}

		function createLine() {
			ctx = self.eContainer.getContext("2d");
			line = new Chart(ctx, {
				type: 'doughnut',
				data: {
					datasets: [{
						label: 'Doughnut',
						data: [], //needs to be dynamic
						backgroundColor: function (ctx) {
							return ctx.dataset.data[ctx.dataIndex].c;
						}
					}]
				},
				options: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = data.datasets[item.datasetIndex].data[item.index];
								return [self.options.x.label+": "+v.x,
										self.options.y.label+": "+v.y,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = myMatrix.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							self.options.callback(self.dashboardChart, this.data.datasets[0].data[selectedIndex].objects);
						}
					},
					animation: {
						duration: 0
					}
				}

			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createLine();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"object-life": function (dashboardChart) {
		var self = this;
		var objectLife, ctx;
		var drillDownData = {
			datasets:[
			]
		};
		var data;
		var objects;
		var _defaultOptions = {
			colorScheme: ["#F4C557", "#5aa972", "#d94153"],
			lifecycleStates:[
				{
					label:"Preparation",
					paramId:"preparation"
				},
				{
					label:"Production",
					paramId:"production"
				},
				{
					label:"Retirement",
					paramId:"retirement"
				}
			]
		}

		function isValidObject(object) {

		}

		function getLabelDates(){
			var labelDates = [];
			var currentYear = self.dashboardChart.dashboard.currentDate.getFullYear();
			var previousYears = (self.options.previousYears)?self.options.previousYears:2;
			var postYears = (self.options.postYears)?self.options.postYears:4;
			var yearDivider = (self.options.yearDivider)?self.options.yearDivider:4;
			if (yearDivider<=1){
				yearDivider = 1;
			}else if (yearDivider<=3){
				yearDivider = 2;
			}else if (yearDivider<=5){
				yearDivider = 4;
			}else if (yearDivider<=7){
				yearDivider = 6;
			}else{
				yearDivider = 12;
			}
			
			for (let year = currentYear - previousYears; year <= currentYear + postYears; year++) {
				for (let yearDivide = 0; yearDivide < yearDivider; yearDivide++) {
					labelDates.push(new Date(year,0 + (yearDivide * (12 / yearDivider)),1));
				}
			}
			self.options.labelDates = labelDates;
		}

		self.updateData = function () {

			getLabelDates();
			objectLife.data.labels = self.options.labelDates;

			data = self.dashboardChart.dashboard.filteredData;
			objects = [];
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}

			var datasets = objectLife.data.datasets;
			var ddDatasets = drillDownData.datasets;
			for (var i = 0; i < datasets.length; i++){
				var dataset = datasets[i];
				dataset.data = [];
				var ddDataset = ddDatasets[i];
				ddDataset.mgsData = [];
			}

			var lifecycleStates = self.options.lifecycleStates;
			for (var i = 0; i < lifecycleStates.length; i++){
				var lifecycleState = lifecycleStates[i];
				var dataset = datasets[i];
				var ddDataset = ddDatasets[i];
				var labelDates = self.options.labelDates;
				for (var j = 0; j < labelDates.length; j++){
					var labelDate = labelDates[j];
					var filteredObjects = [];
					for (var k = 0; k < objects.length; k++){
						var object = objects[k];
						var lifecycle = object.lifecycle;
						if (lifecycle && lifecycle[lifecycleState.paramId] && lifecycle[lifecycleState.paramId].startDate && lifecycle[lifecycleState.paramId].endDate){
							let startDate;
							let endDate;
							if (!lifecycle[lifecycleState.paramId].initialised){
								startDate = new Date(lifecycle[lifecycleState.paramId].startDate);
								lifecycle[lifecycleState.paramId].startDate = startDate;
								endDate = new Date(lifecycle[lifecycleState.paramId].endDate);
								lifecycle[lifecycleState.paramId].endDate = endDate;
								lifecycle[lifecycleState.paramId].initialised = true;
							}else{
								startDate = lifecycle[lifecycleState.paramId].startDate;
								endDate = lifecycle[lifecycleState.paramId].endDate;
							}
							if ((startDate <= labelDate) && (labelDate < endDate)) {
								filteredObjects.push(object);
							}
						}
					}
					dataset.data.push(filteredObjects.length);
					ddDataset.mgsData.push(filteredObjects);
				}
			}

			objectLife.update();
		}

		function createObjectLife() {

			var datasets = [];
			var ddDatasets = []
			var lifecycleStates = self.options.lifecycleStates;
			for (var i = 0; i < lifecycleStates.length; i++){
				var lifecycleState = lifecycleStates[i];
				var dataset = {
					label: lifecycleState.label,
					data: [],
					backgroundColor: self.options.colors[i],
					borderColor: self.options.colors[i],
					fill: false
				}
				datasets.push(dataset);
				var ddDataset = {}
				ddDatasets.push(ddDataset);
			}
			drillDownData.datasets = ddDatasets;
			getLabelDates();

			ctx = self.eContainer.getContext("2d");
			objectLife = new Chart(ctx, {
				type: 'line',
				data: {
					labels: self.options.labelDates,
					datasets: datasets
				},
				options: {
					aspectRatio:self.dashboardChart.dashboard.options.chartAspectRatio,
					legend: {
						display: true
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					scales: {xAxes: [{display: true,type: 'time',time: {unit: 'year'}}],yAxes: [{display: true,}]},
					onClick: function (e) {
						var activePoints = objectLife.getElementsAtEvent(e);
						var activeDatasets = objectLife.getDatasetAtEvent(e);
						if (activePoints[0] && activeDatasets[0] ){
							var selectedIndex = activePoints[0]._index;
							var selectedDataset = activeDatasets[0]._datasetIndex;

							var valueDate = this.data.labels[selectedIndex];
							var valueYYYY = "" + valueDate.getFullYear();
							var valueMM = (valueDate.getMonth()+1)<10?"0"+(valueDate.getMonth()+1):""+(valueDate.getMonth()+1);
							var valueDD = valueDate.getDate()<10?"0"+valueDate.getDate():""+valueDate.getDate();

							var textToSend = this.data.datasets[selectedDataset].label + " - " + valueMM + "/" + valueYYYY;
							self.dashboardChart.callback(self.dashboardChart, drillDownData.datasets[selectedDataset].mgsData[selectedIndex], textToSend);
						}
					},
					animation: {
						duration: 200
					}
				}

			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
			self.options.colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, options.lifecycleStates.length);
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createObjectLife();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"bubble": function (dashboardChart) {
		var self = this;
		var bubble, ctx;
		var data;
		var objects;
		var _defaultOptions = {
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"]
		}

		function isValidObject(object) {

		}

		//TO UPDATE
		self.updateData = function () {
			var dataset = bubble.data.datasets[0];
			dataset.data = [];
			bubble.update();
		}

		function createBubble() {
			ctx = self.eContainer.getContext("2d");
			bubble = new Chart(ctx, {
				type: 'doughnut',
				data: {
					datasets: [{
						label: 'Doughnut',
						data: [], //needs to be dynamic
						backgroundColor: function (ctx) {
							return ctx.dataset.data[ctx.dataIndex].c;
						}
					}]
				},
				options: {
					legend: {
						display: false
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = data.datasets[item.datasetIndex].data[item.index];
								return [self.options.x.label+": "+v.x,
										self.options.y.label+": "+v.y,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = myMatrix.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							self.options.callback(self.dashboardChart, this.data.datasets[0].data[selectedIndex].objects);
						}
					},
					animation: {
						duration: 0
					}
				}

			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createBubble();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"bar":  function (dashboardChart) {
		var self = this;
		var bar, ctx;
		var data;
		var drillDownData = {
			datasets:[
				{
					mgsData:[]
				}
			]
		};
		var objects;
		var _defaultOptions = {
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"],
			collectionName: "Items",
			legendDisplay:false,
			legendPosition:"right",
			maximumValues:9
		}

		function isValidObject(object) {

		}

		//TO UPDATE
		self.updateData = function () {
			var labels = [];
			var dataset = bar.data.datasets[0];
			var ddDataset = drillDownData.datasets[0];
			dataset.data = [];
			ddDataset.mgsData = [];
			data = self.dashboardChart.dashboard.filteredData;
			objects = [];
			var logic = (self.options.logic) ? self.options.logic : {};
			for (var i = 0; i < data.length; i++) {
				MgsDashboardUtility.getSubObjectsFromLogic(data[i], logic, 0, objects);
			}
			logic = (self.options.x.logic) ? self.options.x.logic : {};
			var values = MgsDashboardUtility.getObjectsByValueFromLogic(objects, logic);
			MgsDashboardUtility.prepareValuesForChart(values, self.options.maximumValues);
			self.options.colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(self.options.colorScheme, values.length);
			dataset.backgroundColor = self.options.colors;
			for (var i = 0; i < values.length; i++){
				var value = values[i];
				labels.push(value.name);
				dataset.data.push(value.objects.length);
				ddDataset.mgsData.push({
					"x":value.name,
					"v":value.objects.length,
					"objects":value.objects,
					"c":self.options.colors[i]
				});

			}
			bar.data.labels = labels;

			bar.update();
		}

		function createBar() {
			ctx = self.eContainer.getContext("2d");
			bar = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: [],
					datasets: [{
						label: self.options.x.label,
						data: [], //needs to be dynamic
						mgsData: [],
						backgroundColor: function (ctx) {
							return drillDownData.datasets[0].mgsData.length > 0?drillDownData.datasets[0].mgsData[ctx.dataIndex].c:"#ffffff";
						}
					}]
				},
				options: {
					aspectRatio:self.dashboardChart.dashboard.options.chartAspectRatio,
					legend: {
						display: self.options.legendDisplay,
						position: self.options.legendPosition,
						labels: {
							usePointStyle: true
						}
					},
					title: {
						display: true,
						text: self.options.label,
						fontSize: 20
					},
					tooltips: {
						callbacks: {
							title: function () { return ''; },
							label: function (item, data) {
								var v = drillDownData.datasets[item.datasetIndex].mgsData[item.index];
								return [data.datasets[item.datasetIndex].label+": "+v.x,
										"Number of "+((self.options.objectClassPlural)?self.options.objectClassPlural:"items")+": " + v.v]; 
							}
						}
					},
					onClick: function (e) {
						var activePoints = bar.getElementsAtEvent(e);
						if (activePoints[0]) {
							var selectedIndex = activePoints[0]._index;
							var textToSend = this.data.labels[selectedIndex];
							self.dashboardChart.callback(self.dashboardChart, drillDownData.datasets[0].mgsData[selectedIndex].objects, textToSend, self.options.x.logic);
						}
					},
					animation: {
						animateRotate: true,
						animateScale: true
					},
					plugins: {
						datalabels: {
							display: false
						}
					},
					responsive: true
				}
			});
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboardChart.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("canvas");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createBar();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}

	},

	"box-in-box": function (dashboardChart) {
		var self = this;
		var boxInBox, ctx;
		var data;
		var _defaultOptions = {
			hideStructureWithNoData:true,
			valueEmpty : { "id": "", "name": "Not Selected" },
			shapeGuiNames:{
				background:"Background",
				circle:"Circle",
				triangle:"Triangle",
				square:"Square",
				hexagon:"Hexagon",
				star:"Star"
			},
			sectionGuiNames:{
				filters:"Filters",
				legend:"Legend"
			},
			shapeSize:"16px",
			colorScheme: dashboardChart.dashboard.options.colorScheme?dashboardChart.dashboard.options.colorScheme:["#5aa972", "#F4C557", "#d94153"]
		}


		//TO UPDATE
		self.updateData = function () {
			data = self.dashboardChart.dashboard.filteredData;
			boxInBox.setCurrentDate(self.dashboardChart.dashboard.currentDate);
			boxInBox.update(data);
		}

		function createBoxInBox() {
			boxInBox = new MgsBoxInBoxChart(self.eContainer, self.options);
		}

		function loadOptions(options) {
			self.options = JSON.parse(JSON.stringify(_defaultOptions));
			self.options.colorScheme = (self.options.colorScheme)?self.options.colorScheme:self.dashboardChart.dashboard.options.colorScheme;
			var keys = Object.keys(options);
			for (var i = 0; i < keys.length; i++) {
				self.options[keys[i]] = options[keys[i]];
			}
		}

		//Initislise Renderer
		function init(dashboardChart) {
			self.eParentContainer = dashboardChart.eContainer;
			self.eContainer = document.createElement("div");
			self.eParentContainer.appendChild(self.eContainer);
			self.dashboardChart = dashboardChart;
			loadOptions(dashboardChart.options);
			createBoxInBox();

		}

		//Auto Initislise Renderer
		try {
			init(dashboardChart);
		} catch (e) {
			throw e;
		}
	},

	"force-graph": function (dashboardChart) {

	},

	"tree-map": function (dashboardChart) {

	},

	"dendrogram": function (dashboardChart) {

	},

	"sankey": function (dashboardChart) {

	},

	"chord": function (dashboardChart) {

	}



}


var MgsDashboardDrillDownRenderers = {
	"object-list": function (dashboardDrillDown) {
		var self = this;
		self.options = {
			color:dashboardDrillDown.dashboard.options.colorScheme[0],
			maxHeight: "20rem"
		}
		
		self.eBackDropContainer = document.createElement("div");
		self.eBackDropContainer = dashboardDrillDown.eContainer;
		self.eBackDropContainer.classList.add("modal-backdrop");
		self.eBackDropContainer.classList.add("show");
		
		self.eParentContainer = document.createElement("div");
		self.eParentContainer.classList.add("modal-dialog-centered");
		self.eParentContainer.style.padding = "5em";
		self.eParentContainer.style.border = "5px #22354b";
		self.eBackDropContainer.appendChild(self.eParentContainer);

		self.eModalContainer = document.createElement("div");
		self.eModalContainer.classList.add("modal-content");

		self.eHeaderContainer = document.createElement("div");
		self.eHeaderContainer.classList.add("modal-header");
		self.eHeaderContainer.style.backgroundColor = "#22354b";
		self.eModalContainer.appendChild(self.eHeaderContainer);
		
		self.eHeaderText = document.createElement("h4");
		self.eHeaderText.style.color = "#ffffff";
		self.eHeaderText.style.padding = ".5em";
		self.eHeaderContainer.appendChild(self.eHeaderText);

		self.eHeaderClose = document.createElement("button");
		self.eHeaderClose.classList.add("close");
		self.eHeaderClose.style.cursor = "pointer";
		self.eHeaderClose.style.color = "#ffffff";
		self.eHeaderClose.style.width = "1.5em";

		self.eHeaderClose.innerText = "x";
		self.eHeaderClose.onclick = function(){
			dashboardDrillDown.hide();
		}
		self.eHeaderContainer.appendChild(self.eHeaderClose);

		self.eTableContainer = document.createElement("div");
		self.eTableContainer.classList.add("modal-body");
		
		self.eTableContainer.style.overflow = "auto";
		//self.eParentContainer.appendChild(self.eTableContainer);
		self.eModalContainer.appendChild(self.eTableContainer);
		self.eParentContainer.appendChild(self.eModalContainer);

		self.eContainer = document.createElement("table");
		self.eContainer.classList.add("table");
		self.eTableContainer.appendChild(self.eContainer);

		this.display = function (data, label, extraText, logic) {
			self.eTableContainer.style.maxHeight = self.options.maxHeight;
			//self.eHeaderContainer.style.backgroundColor = self.options.color;
			while(self.eContainer.children.length > 0){
				self.eContainer.children[0].remove();
			}
			self.eHeaderText.innerText = label + (extraText?": " + extraText:"");
			var thead = document.createElement("thead");
			self.eContainer.appendChild(thead);
			var thRow = document.createElement("tr");
			thead.appendChild(thRow);
			var th = document.createElement("th");
			th.innerText = "Object Name";
			thRow.appendChild(th);
			if (logic){
				th = document.createElement("th");
				th.innerText = "Values";
				thRow.appendChild(th);
			}

			var tbody = document.createElement("tbody");
			self.eContainer.appendChild(tbody);
			for (var i = 0, iMax = data.length; i < iMax; i++){
				var object = data[i];
				var tdRow = document.createElement("tr");
				tbody.appendChild(tdRow);
				var td = document.createElement("td");
				tdRow.appendChild(td);
				var anchor =  document.createElement("a");
				anchor.innerText = object.name;
				anchor.setAttribute("href", object.href);
				td.appendChild(anchor);
				if (logic){
					var objectValues = MgsDashboardUtility.getObjectsByValueFromLogic([object], logic);
					td = document.createElement("td");
					tdRow.appendChild(td);
					for (var j = 0; j <objectValues.length; j++){
						var valueDiv = document.createElement("div");
						valueDiv.innerText = objectValues[j].name;
						td.appendChild(valueDiv);

					}
				}
				
			}
			self.eParentContainer.scrollIntoView();

		}
	},

	"filtered-table": function (dashboardDrillDown) {
		var self = this;

		this.display = function (data, label) {
			console.log({data:data,label:label});
		}
	}

}