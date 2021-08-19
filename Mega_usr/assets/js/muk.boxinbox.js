var MgsBoxInBoxChart = function(eParentContainer, options){
    var self = this;
    var structureInitialised = false;
    var firstUpdateAttempted = false;
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
        fontSize:"12px",
        structureFontSize:"1rem",
        colorScheme: ["#5aa972", "#F4C557", "#d94153"],
        colorDark:"#000000",
        colorLight:"#ffffff",
        structureColorScheme:{
            //background:["#78909c","#90a4ae","#b0bec5","#cfd8dc","#eceff1"],
            background:["#CBD8E0","#d3dee5","#edf2f5","#f7f9fb","#ffffff"],
			//background:["#ffffff","#f5f7f9","#edf2f5","#d4dfe6","#CBD8E0"],
            //header:["#ffffff","#f5f7f9","#edf2f5","#d4dfe6","#CBD8E0"],
			//background:["#ffffff","#CBD8E0","#ffffff","#CBD8E0","#ffffff"],
            //header:["#ffffff","#CBD8E0","#ffffff","#CBD8E0","#ffffff"],
            //header:["#CBD8E0","#d3dee5","#edf2f5","#f7f9fb","#ffffff"],
            header:["#22354b","#22354b","#22354b","#22354b","#22354b"],			

            //header:["#78909c","#90a4ae","#b0bec5","#cfd8dc","#eceff1"],
            //header:["#263238","#37474f","#455a64","#546e7a","#607d8b"],
            //text:["#31B672","#31B672","#31B672","#31B672","#31B672"]
            //text:["#263238","#263238","#263238","#263238","#263238"]
            text:["#ffffff","#ffffff","#ffffff","#ffffff","#ffffff"]
        },
        noDataToDisplay:"No data to display"
        /* Filters example
        filters:[
            {
                "name":"Monthly Cost",
                "colorScheme":[],
                "values":[
                    {
                        "name":"Less than £1,000",
                        "logic":{
                            "fields":"cost",
                            "operator": "<",
                            "value":1000
                        }
                    },
                    {
                        "name":"£1,000 - £5,000",
                        "logic":[
                            "fields":"cost",
                            "operator": ">=<",
                            "value":[1000,5000]
                        ]
                    },
                    {
                        "name":"More than £5,000",
                        "logic":[
                            "fields":"cost",
                            "operator": ">",
                            "value":5000
                        ]
                    }
                ]
            }
        ]
        */
    }


    var data = {
        structure:[],
        objects:[]
    }

    var fData = null;

    var objectRows = [];

    var mappedFilters = {
        background:null,
        circle:null,
        triangle:null,
        square:null,
        hexagon:null,
        star:null
    }


    var shapes = {
        head:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">",
        foot:"</svg>",
        circle:"<circle style=\"fill:%fill%;stroke:black;stroke-width:2;\" cx=\"50\" cy=\"50\" r=\"40\"></circle>",
        triangle:"<polygon style=\"fill:%fill%;stroke:black;stroke-width:2;\" points=\"50,16 85,85 15,85 50,16\"></polygon>",
        square:"<polygon style=\"fill:%fill%;stroke:black;stroke-width:2;\" points=\"9,9 9,91 91,91 91,9\"></polygon>",
        hexagon:"<polygon style=\"fill:%fill%;stroke:black;stroke-width:2;\" points=\"30.1,84.5 10.2,50 30.1,15.5 69.9,15.5 89.8,50 69.9,84.5\"></polygon>",
        star:"<polygon style=\"fill:%fill%;stroke:black;stroke-width:2;\" points=\"50,9 60.5,39.5 92.7,40.1 67,59.5 76.4,90.3 50,71.9 23.6,90.3 32.9,59.5 7.2,40.1 39.4,39.5 \"></polygon>"
    }

    

    function getColorFromObjectAttributeValue(object, filter){
        var ret = {
            text:"",
            color:"",
        };
        if (!filter || !filter.values) return ret;
        for (var i = 0; i < filter.values.length; i++){
            var filterValue = filter.values[i];
            var logic = filterValue.logic;
            if (!logic) continue;
            if (!Array.isArray(logic)) logic = [logic];
            var bPassed = true;
            for (var j = 0; j < logic.length; j++){
                var logicTest = logic[j];
                if (!MgsDashboardUtility.processLogic(object, logicTest, self.options.currentDate)){
                    bPassed = false;
                    break;
                }
            }
            if (bPassed){
                ret.text = filterValue.name;
                ret.color = filterValue.color;
                break;
            }
        }
        return ret;
    }

    function createShape(shape, value){
        var color = value.color;
        var text = (value.label?value.label + ": " :"") + value.text;
        
        var shapeHtml = shapes.head + shape.replace("%fill%", color) + shapes.foot;
        var shapeB64 = btoa(shapeHtml);
        var shapeImg = document.createElement("img");
        shapeImg.setAttribute("title", text);
        shapeImg.setAttribute("src", "data:image/svg+xml;base64,"+shapeB64);
        shapeImg.style.height = "100%";
        shapeImg.style.width = "100%";
        return shapeImg;
    }

    function getShapeForObjectAttributeValue(object, sShape){
        var shape = shapes[sShape];
        var filter = mappedFilters[sShape];
        var shapeContainer = document.createElement("div");
        shapeContainer.style.display = "inline-block";
        shapeContainer.style.height = self.options.shapeSize?self.options.shapeSize:"20px";
        shapeContainer.style.width = self.options.shapeSize?self.options.shapeSize:"20px";
        if (shape && filter){
            var value = getColorFromObjectAttributeValue(object, filter);
            if (value && value.color && value.color.length > 0){
                value.label = filter.name;
                shapeContainer.appendChild(createShape(shape, value));
            }
        }

        return shapeContainer;
    }

    function drawObjectAttributes(object, tableRow, tableCell){
        while (tableCell.firstChild) {tableCell.removeChild(tableCell.lastChild);}
        tableRow.style.backgroundColor = "";
        tableRow.style.color = "";
        tableRow.firstChild.style.color = tableRow.style.color;
        if (tableRow.firstChild.firstChild) tableRow.firstChild.firstChild.style.color = tableRow.style.color;
        tableRow.setAttribute("title","");
        if (!mappedFilters) return;
        if (mappedFilters.background){
            var bg = getColorFromObjectAttributeValue(object, mappedFilters.background);
            tableRow.style.backgroundColor = bg.color;
            tableRow.style.color = bg.color != ""?MgsDashboardUtility.getColorBasedOnBackgroundColor(bg.color, self.options.colorDark, self.options.colorLight):"";
            tableRow.firstChild.style.color = tableRow.style.color;
            if (tableRow.firstChild.firstChild) tableRow.firstChild.firstChild.style.color = tableRow.style.color;
            if (mappedFilters.background)
            tableRow.setAttribute("title",mappedFilters.background.name + ": " + bg.text);
        }
        tableCell.appendChild(getShapeForObjectAttributeValue(object, "circle"));
        tableCell.appendChild(getShapeForObjectAttributeValue(object, "triangle"));
        tableCell.appendChild(getShapeForObjectAttributeValue(object, "square"));
        tableCell.appendChild(getShapeForObjectAttributeValue(object, "hexagon"));
        tableCell.appendChild(getShapeForObjectAttributeValue(object, "star"));

    }

    function drawObjectRow(object, objectTable){
        var row = document.createElement("tr");
        row.style.fontSize = self.options.fontSize?self.options.fontSize:"";
        objectTable.appendChild(row);
        var td = document.createElement("td");
        td.style.fontSize = self.options.fontSize?self.options.fontSize:"";
        td.classList.add("p-1");
        var anchor =  document.createElement("a");
        anchor.innerText = object.name;
        anchor.setAttribute("href", object.href);
        td.appendChild(anchor);
        row.appendChild(td);
        td = document.createElement("td");
        td.style.fontSize = self.options.fontSize?self.options.fontSize:"";
        td.classList.add("p-1");
        td.style.width=  "100px";
        row.appendChild(td);

        objectRows.push({
            object:object,
            row:row,
            cell:td
        });
        
    }

    function drawObjects(objects, objectContainer){
        var objectTable = document.createElement("table");
        objectTable.classList.add("tableBiB");
        objectContainer.appendChild(objectTable);
        for (var i =0; i < objects.length; i++){
            var object = objects[i];
            drawObjectRow(object, objectTable);
        }
    }

    function drawLegendItem(sShape, table){

        var filter = mappedFilters[sShape];
        if (!filter || !filter.values)return;

        var tr = document.createElement("tr");
        table.appendChild(tr);

        var th = document.createElement("th");
        th.style.width = "200px";
        // th.classList.add("p-1");
        // th.classList.add("pb-2");
        // th.classList.add("align-middle");
        tr.appendChild(th);
        th.innerText = filter.name;

        var td = document.createElement("td");
        // td.classList.add("p-0");
        // td.classList.add("pb-2");
        tr.appendChild(td);

        for (var i = 0; i < filter.values.length; i++){
            var value = filter.values[i];
            var valContainer = document.createElement("div");
            valContainer.classList.add("p-1");
            valContainer.style.display = "inline-block";
            valContainer.style.width = "150px";
            td.appendChild(valContainer);
            var valText = document.createElement("div");
            valText.classList.add("text-center");
            valText.innerText = value.name;

            valContainer.appendChild(valText);
            var valIcon = document.createElement("div");
            valIcon.classList.add("text-center");
            valContainer.appendChild(valIcon);
            if (sShape === "background"){
                valIcon.innerHTML = "&nbsp;"
                valIcon.style.backgroundColor = value.color;
            }else{
                var shape = shapes[sShape];
                var shapeContainer = document.createElement("div");
                shapeContainer.style.display = "inline-block";
                shapeContainer.style.height = self.options.shapeSize?self.options.shapeSize:"20px";
                shapeContainer.style.width = self.options.shapeSize?self.options.shapeSize:"20px";
                var shapeValue = {
                    label: filter.name,
                    color: value.color,
                    text: value.name
                }
                value.label = filter.name;
                shapeContainer.appendChild(createShape(shape, shapeValue));

                valIcon.appendChild(shapeContainer);
            }
            


        }
    }

    function drawAccordianHeader(eHead, eBody, sText, accordionTypeFilter){
        var rightArrow = "\u25B9";
        var downArrow = "\u25BF";
        eBody.style.display = "none";

        var eButton = document.createElement("button");
        eButton.classList.add("btn");
        eButton.classList.add("btn-lg");
        eButton.classList.add("p-2");
        eButton.classList.add("btn-block");
        eButton.classList.add("text-left");  
		// eButton.classList.add("fa fa-wrench"); 
        eHead.appendChild(eButton);
		
        var eButtonArrow = document.createElement("span");
        eButtonArrow.style.marginRight = "auto";
        eButtonArrow.style.color = "white";
		//console.log("accordionTypeFilter "+accordionTypeFilter);
		if (accordionTypeFilter) {
			eButtonArrow.classList.add("fa"); 
			eButtonArrow.classList.add("fa-wrench"); 
			console.log("FILTER accordionTypeFilter "+accordionTypeFilter);
		} else {
			console.log("LEGEND accordionTypeFilter "+accordionTypeFilter);
			eButtonArrow.classList.add("fa"); 
			eButtonArrow.classList.add("fa-question-circle"); 
		}		
        eButtonArrow.innerText = rightArrow;
        eButton.appendChild(eButtonArrow);

        var eButtonText = document.createElement("span");
		eButtonText.classList.add(sText); 
		eButtonText.classList.add("buttonTitle"); 
        eButtonText.innerText = sText;
		eButtonText.style.display = "none";
        eButton.appendChild(eButtonText);

        eButton.onclick = function(){

            if (eBody.style.display == "none"){
                eBody.style.display = "block";
				$("."+sText).each(function(i, obj) {
					this.style.display = "inline";
					console.log("block "+sText)
				});	
				eButtonArrow.innerText = downArrow;
            }else{
                eBody.style.display = "none";
				$("."+sText).each(function(i, obj) {
					this.style.display = "none";
				});
				eButtonArrow.innerText = rightArrow;
            }

        }
    }

    function drawLegend(){

        while (self.eLegendContainer.firstChild) {self.eLegendContainer.removeChild(self.eLegendContainer.lastChild);}
        self.eLegendContainer.classList.remove("card");
        if (! 
            (
                mappedFilters["background"] || 
                mappedFilters["circle"] || 
                mappedFilters["triangle"] || 
                mappedFilters["square"] || 
                mappedFilters["hexagon"] || 
                mappedFilters["star"] 
            ) 
        ) return;

        self.eLegendContainer.classList.add("card");
        self.eLegendContainer.classList.add("p-0");
		self.eLegendContainer.id='parameterLegend';

        var eHead = document.createElement("div");
        //eHead.classList.add("card-header");
        eHead.classList.add("Card-header-BiB");
        eHead.classList.add("p-0");
        self.eLegendContainer.appendChild(eHead);
        
        var eBody = document.createElement("div");
        eBody.classList.add("card-body");
        eBody.classList.add("p-2");
		// var eButtonText = document.createElement("span");
        // eButtonText.innerText = "Legend";
        // eBody.appendChild(eButtonText);
        self.eLegendContainer.appendChild(eBody);

        var table = document.createElement("table");
        table.classList.add("tableLegendBib");
        drawLegendItem("background", table);
        drawLegendItem("circle", table);
        drawLegendItem("triangle", table);
        drawLegendItem("square", table);
        drawLegendItem("hexagon", table);
        drawLegendItem("star", table);

        eBody.appendChild(table);

        var sText = options.sectionGuiNames.legend;
		var accordionTypeFilter = false;
        drawAccordianHeader(eHead, eBody, sText, accordionTypeFilter);
    }

    function drawStructure(currentNode, currentContainer, iLevel){
        if (typeof iLevel == "undefined") iLevel = 0;
        var headColor = self.options.structureColorScheme.header[iLevel < self.options.structureColorScheme.header.length?iLevel:self.options.structureColorScheme.header.length-1];
        var bgColor = self.options.structureColorScheme.background[iLevel < self.options.structureColorScheme.background.length?iLevel:self.options.structureColorScheme.background.length-1];
        var txtColor = self.options.structureColorScheme.text[iLevel < self.options.structureColorScheme.text.length?iLevel:self.options.structureColorScheme.text.length-1];

        var containerOuter = document.createElement("div");
        containerOuter.classList.add("card");
        containerOuter.classList.add("col-12");
		if (typeof dataStructure.id == 'undefined' && dataStructure.id == null) {
			if (iLevel < 2) containerOuter.classList.add("col-xl-6");
		} else {
			if (iLevel > 0) containerOuter.classList.add("col-xl-6");
		}
        containerOuter.classList.add("p-1");
        containerOuter.style.border = "2px #31B672";
        containerOuter.style.backgroundColor = "transparent";
        currentContainer.appendChild(containerOuter);
        
        var container = document.createElement("div");
        container.classList.add("card");
        container.classList.add("col-12");
        container.classList.add("p-0");
        container.classList.add("b-0");
        containerOuter.appendChild(container);

        var headContainer = document.createElement("div");
        //headContainer.classList.add("card-header");
        headContainer.classList.add("Card-header-BiB");
        headContainer.classList.add("p-1");
        headContainer.style.backgroundColor = headColor;
        headContainer.style.color = txtColor;
        container.appendChild(headContainer);

        // var titleContainer = document.createElement("div");
        // headContainer.appendChild(titleContainer);

        // var title = document.createElement("div");
        // title.innerText = currentNode.name;
        // titleContainer.appendChild(title);
		
		var title = document.createElement("div");
        title.innerText = currentNode.name;
        headContainer.appendChild(title);

        // var controlContainer = document.createElement("div");
        // headContainer.appendChild(controlContainer);


        var bodyContainer = document.createElement("div");
        bodyContainer.classList.add("card-body");
        bodyContainer.classList.add("p-2");
        bodyContainer.style.backgroundColor = bgColor;
        container.appendChild(bodyContainer);

        var content = document.createElement("div");
        bodyContainer.appendChild(content);
        if (currentNode.objects && currentNode.objects.length > 0){
            var objectContainer = document.createElement("div");
            content.appendChild(objectContainer);
            drawObjects(currentNode.objects, objectContainer);
        }

        var subContainer = document.createElement("div");
        subContainer.classList.add("row");
        subContainer.classList.add("justify-content-start");
        content.appendChild(subContainer);

        var children = currentNode.children;
        for (var i =0; i < children.length; i++){
            drawStructure(children[i], subContainer, iLevel +1);
        }

    }

    function drawFilter(sShape, table){
        var label = self.options.shapeGuiNames[sShape];
        var delim = "|";
        if (!label) return;

        var filters = self.options.filters;
        var row = document.createElement("tr");
        table.appendChild(row);
        var th = document.createElement("th");
        th.style.width = "150px";
        th.classList.add("p-1");
        th.classList.add("pb-2");
        th.innerText = label;
        row.appendChild(th);

        var td = document.createElement("td");
        td.classList.add("p-1");
        td.classList.add("pb-2");
        row.appendChild(td);

        var select = document.createElement("select");
        td.appendChild(select);

        select.onchange = function () {
			var currentValue = (select.value && select.value !== "") ? select.value : null;
			if (currentValue === null) return;
            currentValue = currentValue.split(delim);
			// console.log("currentValue onChange "+currentValue);
            var shapeId = currentValue[0];
            var filterId = (currentValue[1])?parseInt(currentValue[1]):null;
            if (filterId === null){
                mappedFilters[shapeId] = null;
            }else{
                mappedFilters[shapeId] = options.filters[filterId];
            }
			if (objectRows){
                for (var i =0; i < objectRows.length; i++){
                    drawObjectAttributes(objectRows[i].object, objectRows[i].row, objectRows[i].cell);
                }
            }
            drawLegend();
        }
        
        self.options.valueEmpty = self.options.valueEmpty ? self.options.valueEmpty : { "id": "", "name": "Not Selected" };
        for (var i = -1; i < filters.length; i++){
            var value = (i < 0) ? {"id":sShape,"name":self.options.valueEmpty.name} : {"id":sShape+delim+i, "name":filters[i].name};
            var eOption = document.createElement("option");
			eOption.value = value.id;
			eOption.text = value.name;
			select.appendChild(eOption);
        }
    }




    function drawFilters(){

        var filters = self.options.filters;
        if (!filters) return;
        if (!Array.isArray(filters)) filters = [filters];
        self.options.filters = filters;

        self.eFiltersContainer.classList.add("card");
        self.eFiltersContainer.classList.add("p-0");
		self.eFiltersContainer.id='parameterPopup';
        var eHead = document.createElement("div");
        //eHead.classList.add("card-header");
        eHead.classList.add("Card-header-BiB");
        eHead.classList.add("p-0");
        self.eFiltersContainer.appendChild(eHead);
        
        var eBody = document.createElement("div");
        eBody.classList.add("card-body");
        eBody.classList.add("p-2");
		// var eButtonText = document.createElement("span");
        // eButtonText.innerText = "Filters";
        // eBody.appendChild(eButtonText);
        self.eFiltersContainer.appendChild(eBody);
		

        var table = document.createElement("table");
        table.classList.add("tableLegendBib");
        drawFilter("background", table);
        drawFilter("circle", table);
        drawFilter("triangle", table);
        drawFilter("square", table);
        drawFilter("hexagon", table);
        drawFilter("star", table);
        eBody.appendChild(table);

        var sText = options.sectionGuiNames.filters;
		var accordionTypeFilter = true;
        drawAccordianHeader(eHead, eBody, sText, accordionTypeFilter);
    }

    function draw(){
        var structure = fData.structure;
		var currentValueTemp = self.currentValue
        var currentContainer = self.eStructureContainer;
        currentContainer.classList.add("row");
        currentContainer.classList.add("justify-content-start");
        while (currentContainer.firstChild) {currentContainer.removeChild(currentContainer.lastChild);}	
		console.log("currentValueTemp " +currentValueTemp);
		console.log("currentContainer " +currentContainer);
	
		if (!structure || structure.length === 0) {
			// No Data to Display
			var noDataElement = document.createElement("div");
			noDataElement.classList.add("card");
			noDataElement.classList.add("col-12");
			noDataElement.classList.add("p-1");
			noDataElement.style.border = "none";
			noDataElement.style.backgroundColor = "transparent";
			currentContainer.appendChild(noDataElement);
			var noDataElementInner = document.createElement("div");
			noDataElementInner.classList.add("card");
			noDataElementInner.classList.add("col-12");
			noDataElementInner.classList.add("p-0");
			noDataElementInner.classList.add("b-0");
			noDataElementInner.innerText = self.options.noDataToDisplay;
			noDataElement.appendChild(noDataElementInner);           
		} else {
			if (typeof dataStructure.id == 'undefined' && dataStructure.id == null) {
			// full structure
				//console.log("dataStructure.id undefined");
				//console.log("dataStructure.id null "+JSON.stringify(dataStructure));
				for (var i =0; i < structure.length; i++){
					//console.log("loop "+[i]);
					//console.log("structure.id"+[i]+structure[i].id);
					drawStructure(structure[i], currentContainer);
				}
			} else {
				console.log("dataStructure defined");
				console.log("dataStructure defined "+JSON.stringify(dataStructure));
				for (var i =0; i < structure.length; i++){
					//console.log("data.structure"+[i]+" "+data.structure[i].id);
					//console.log("dataStructure.id "+dataStructure.id);
					//console.log("structure[i].id "+structure[i].id);
					if (structure[i].id === dataStructure.id) {
						//console.log("structure[i].id === dataStructure.id");
						drawStructure(structure[i], currentContainer);
					}
				}
			}
		}
           
        if (objectRows){
            for (var i =0; i < objectRows.length; i++){
                drawObjectAttributes(objectRows[i].object, objectRows[i].row, objectRows[i].cell);
            }
        }
        drawLegend();
    }


    function addObjectsToStructureData(currentNode){
        var children = (currentNode)?currentNode.children:fData.structure;
        if (!children) return;
        var objects = data.objects;
        for (var i = 0; i < children.length; i++){
            var sNode = children[i];
            sNode.objects = [];
            for (var j = 0; j < objects.length; j++){
                var object = objects[j];
                var containers = MgsDashboardUtility.getSubObjectsFromLogic(object, self.options.logic);
                if (!containers) continue;
                for (var k = 0; k < containers.length; k++){
                    var container = containers[k];
                    if (container.id == sNode.id){
                        if (!sNode.objects) sNode.objects = [];
                        sNode.objects.push(object);
                        break;
                    }
                }

            }
            addObjectsToStructureData(sNode);
        }
    }

    function filterStructureData(currentNode){

        var children = (currentNode)?currentNode.children:fData.structure;
		//console.log("children "+children);
        if (!children) return;
        var fChildren = [];
        for (var i = 0; i < children.length; i++){
            var sNode = children[i];
            if (containsObjects(sNode)){
                fChildren.push(sNode); 
            }
        }
        if (!currentNode){
            fData.structure = fChildren;
        }else{
            currentNode.children = fChildren;
        }
        for (var i = 0; i < fChildren.length; i++){
            var sNode = fChildren[i];
            filterStructureData(sNode);
        }

    }

    function containsObjects(currentNode){
        var objects = currentNode.objects;
        if (objects && objects.length > 0) return true;
        var children = currentNode.children;
        if (!children) return false;
        for (var i = 0; i < children.length; i++){
            var sNode = children[i];
            if (containsObjects(sNode)) return true;
        }
        return false;
    }

    function copyData(dataToCopy) {
		var d = (dataToCopy) ? JSON.parse(JSON.stringify(dataToCopy)) : null;
		return d;
	}

    self.update = function(dataForUpdate){
        if (!firstUpdateAttempted)firstUpdateAttempted=true;
        objectRows = [];
		
        if (dataForUpdate) data.objects = dataForUpdate;
        if (!structureInitialised) return;
        try{
            fData = copyData(data);
            addObjectsToStructureData();

            if (self.options.hideStructureWithNoData) filterStructureData();
            draw();
        }catch(e){
            console.log(e);  
        }
    }

    self.setCurrentDate = function(date){
        self.options.currentDate = date;
    }

	function loadOptions(options) {
        self.options = JSON.parse(JSON.stringify(_defaultOptions));
        self.options.currentDate = new Date();
		var keys = Object.keys(options);
		for (var i = 0; i < keys.length; i++) {
			self.options[keys[i]] = options[keys[i]];
		}
	}

    function loadStructureDataFromUrl(){

        var xmlhttp = new XMLHttpRequest();
        var url = self.structureDataUrl;
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                data.structure = JSON.parse(this.responseText);
                structureInitialised = true;
                if (firstUpdateAttempted) self.update();
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    function initialiseFilterValueColors(){
        var filters = self.options.filters;
        if (!filters) return;
        for (var j = 0; j < filters.length; j++){
            var filter = filters[j];
            if (!(filter.values && filter.values.length && filter.values.length > 0)) continue;
            var colorScheme = filter.colorScheme?filter.colorScheme:options.colorScheme;
            var colors = MgsDashboardUtility.getInterpolatedColorsFromScheme(colorScheme, filter.values.length);
            for (var i = 0; i < filter.values.length; i++){
                var filterValue = filter.values[i];
                filterValue.color = filterValue.color?filterValue.color:colors[i];
            }
        }
    }


    function init(eParentContainer, options){
        self.eParentContainer = eParentContainer;
        loadOptions(options);
        self.eContainer = document.createElement("div");
        self.eParentContainer.appendChild(self.eContainer);
        self.eFiltersContainer = document.createElement("div");
        self.eContainer.appendChild(self.eFiltersContainer);
        self.eLegendContainer = document.createElement("div");
        self.eContainer.appendChild(self.eLegendContainer);
        self.eStructureContainer = document.createElement("div");
        self.eContainer.appendChild(self.eStructureContainer);
        initialiseFilterValueColors();
        if (self.options.structureData){
            data.structureData = self.options.structureData;
            structureInitialised = true;
        }else if (self.options.structureDataUrl){
            self.structureDataUrl = self.options.structureDataUrl;
            loadStructureDataFromUrl();
        }
        
        drawFilters();
    }

    try{
        init(eParentContainer, options);
    }catch(e){
        console.log(e);
    }

}