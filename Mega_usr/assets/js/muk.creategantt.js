function mukCreateGantt(elementId, jsonUrl) {
    // static variables
    var urlZoomIn = "../standard/gantt_zoomin.png";
    var urlZoomOut = "../standard/gantt_zoomout.png";

    var ganttId = "ganttchart_" + elementId;


    // Create Elements
    var elChartContainer = document.getElementById(elementId);

    var elZoomTable = document.createElement("table");
    elZoomTable.style.textAlign = "left";
    elChartContainer.appendChild(elZoomTable);
    var elZoomTableRow = document.createElement("tr");
    elZoomTable.appendChild(elZoomTableRow);

    var elZoomInCell = document.createElement("td");
    elZoomInCell.style.textAlign = "left";
    elZoomTableRow.appendChild(elZoomInCell);
    var elZoomIn = document.createElement("img");
    elZoomIn.setAttribute("src", urlZoomIn);
    elZoomIn.setAttribute("title","Zoom In");
    elZoomInCell.appendChild(elZoomIn);

    var elZoomOutCell = document.createElement("td");
    elZoomOutCell.style.textAlign = "left";
    elZoomTableRow.appendChild(elZoomOutCell);
    var elZoomOut = document.createElement("img");
    elZoomOut.setAttribute("src", urlZoomOut);
    elZoomOut.setAttribute("title","Zoom Out");
    elZoomOutCell.appendChild(elZoomOut);

    var elBreak = document.createElement("br");
    elChartContainer.appendChild(elBreak);

    var elZoomDiv = document.createElement("div");
    elChartContainer.appendChild(elZoomDiv);

    var elBreak = document.createElement("br");
    elChartContainer.appendChild(elBreak);
    
    var elGanttContainer = document.createElement("div");
    elGanttContainer.id = ganttId;
    elChartContainer.appendChild(elGanttContainer);




    //Create Variables
    var gantChart = Gantt.getGanttInstance();
    var tasks = {};

    gantChart.templates.grid_row_class = gantChart.templates.task_class = function (start, end, task) {
        var css = [];
        if (((task.type == gantChart.config.types.onerowformilestones) || (task.type == gantChart.config.types.onerow)) && (gantChart.hasChild(task.id))) {
            css.push("task-parent");
        }
        return css.join(" ");
    };

    var currentZoomValue = 8;

    var createBox = function (sizes, class_name) {
        var box = document.createElement("div");
        box.style.cssText = [
            "height:" + sizes.height + "px",
            "line-height:" + sizes.height + "px",
            "width:" + sizes.width + "px",
            "top:" + sizes.top + "px",
            "left:" + sizes.left + "px",
            "position:absolute"
        ].join(";");
        box.className = class_name;
        return box;
    }

    var layer_id_Synthesis = gantChart.addTaskLayer(function show_hidden(task) {
        if (((task.type == gantChart.config.types.onerowformilestones) || (task.type == gantChart.config.types.onerow)) && (gantChart.hasChild(task.id))) {
            var sub_height = gantChart.config.row_height - 5,
                el = document.createElement("div"),
                sizes = gantChart.getTaskPosition(task);
            var sub_tasks = gantChart.getChildren(task.id);
            var child_el;
            for (var i = 0; i < sub_tasks.length; i++) {
                var child = gantChart.getTask(sub_tasks[i]);
                var child_sizes = gantChart.getTaskPosition(child);
                if (child.insynthesis != "no") {
                    ;
                    var strStyle = "";
                    if (task.type == gantChart.config.types.onerow) {
                        strStyle = "onerow_task gantt_task_line" + " " + child.style;
                    }
                    else if (task.type == gantChart.config.types.onerowformilestones) {
                        strStyle = "onerowformilestones_task " + "gantt_milestone" + " " + child.style + " ";
                    }
                    child_el = createBox({
                        height: sub_height,
                        top: sizes.top,
                        left: child_sizes.left,
                        width: child_sizes.width
                    }, strStyle);
                    child_el.innerHTML = child.text;
                    el.appendChild(child_el);
                }
            }
            return el;
        }
        return false;
    });

    var setScaleConfigGantChart = function (value) {
        switch (value) {
            case 1:
                gantChart.config.scale_unit = "day";
                gantChart.config.step = 1;
                gantChart.config.date_scale = "%d %M %Y";
                gantChart.config.min_column_width = 80;
                gantChart.config.subscales = [];
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = null;
                break;
            case 2:
                var weekScaleTemplate = function (date) {
                    var dateToStr = gantChart.date.date_to_str("%d %M");
                    var endDate = gantChart.date.add(gantChart.date.add(date, 1, "week"), -1, "day");
                    return dateToStr(date) + " - " + dateToStr(endDate);
                };
                gantChart.config.scale_unit = "week";
                gantChart.config.step = 1;
                gantChart.templates.date_scale = weekScaleTemplate;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                break;
            case 3:
                var weekScaleTemplate = function (date) {
                    var dateToStr = gantChart.date.date_to_str("%d %M");
                    var endDate = gantChart.date.add(gantChart.date.add(date, 2, "week"), -1, "day");
                    return dateToStr(date) + " - " + dateToStr(endDate);
                };
                gantChart.config.scale_unit = "week";
                gantChart.config.step = 2;
                gantChart.templates.date_scale = weekScaleTemplate;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                break;
            case 4:
                gantChart.config.scale_unit = "month";
                gantChart.config.step = 1;
                gantChart.config.date_scale = "%F %Y";
                gantChart.config.min_column_width = 90;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = null;
                break;
            case 5:
                var monthScaleTemplate = function (date) {
                    var dateToStrS = gantChart.date.date_to_str("%M");
                    var dateToStrE = gantChart.date.date_to_str("%M %Y");
                    var endDate = gantChart.date.add(date, 1, "month");
                    return dateToStrS(date) + " - " + dateToStrE(endDate);
                };
                gantChart.config.scale_unit = "month";
                gantChart.config.step = 2;
                gantChart.config.min_column_width = 90;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = monthScaleTemplate;
                break;
            case 6:
                var monthScaleTemplate = function (date) {
                    var dateToStrS = gantChart.date.date_to_str("%M");
                    var dateToStrE = gantChart.date.date_to_str("%M %Y");
                    var endDate = gantChart.date.add(date, 2, "month");
                    return dateToStrS(date) + " - " + dateToStrE(endDate);
                };
                gantChart.config.scale_unit = "month";
                gantChart.config.step = 3;
                gantChart.config.min_column_width = 90;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = monthScaleTemplate;
                break;
            case 7:
                var monthScaleTemplate = function (date) {
                    var dateToStrS = gantChart.date.date_to_str("%M");
                    var dateToStrE = gantChart.date.date_to_str("%M %Y");
                    var endDate = gantChart.date.add(date, 5, "month");
                    return dateToStrS(date) + " - " + dateToStrE(endDate);
                };
                gantChart.config.scale_unit = "month";
                gantChart.config.step = 6;
                gantChart.config.min_column_width = 90;
                gantChart.config.subscales = [
                ];
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = monthScaleTemplate;
                break;
            case 8:
                gantChart.config.scale_unit = "year";
                gantChart.config.step = 1;
                gantChart.config.date_scale = "%Y";
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = null;
                gantChart.config.subscales = [
                ];
                break;
            case 9:
                var yearScaleTemplate = function (date) {
                    var dateToStr = gantChart.date.date_to_str("%Y");
                    var endDate = gantChart.date.add(date, 1, "year");
                    return dateToStr(date) + " - " + dateToStr(endDate);
                };
                gantChart.config.scale_unit = "year";
                gantChart.config.step = 2;
                gantChart.config.date_scale = "%Y";
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = yearScaleTemplate;
                gantChart.config.subscales = [
                ];
                break;
            case 10:
                var yearScaleTemplate = function (date) {
                    var dateToStr = gantChart.date.date_to_str("%Y");
                    var endDate = gantChart.date.add(date, 4, "year");
                    return dateToStr(date) + " - " + dateToStr(endDate);
                };
                gantChart.config.scale_unit = "year";
                gantChart.config.step = 5;
                gantChart.config.date_scale = "%Y";
                gantChart.config.scale_height = 30;
                gantChart.templates.date_scale = yearScaleTemplate;
                gantChart.config.subscales = [
                ];
                break;
        }
    }


    var getScaleConfigNameGantChart = function (value) {
        var zoom = "Scale step:";
        switch (value) {
            case 1:
                return zoom + " day";
                break;
            case 2:
                return zoom + " week";
                break;
            case 3:
                return zoom + " 2 weeks";
                break;
            case 4:
                return zoom + " month";
                break;
            case 5:
                return zoom + " 2 months";
                break;
            case 6:
                return zoom + " 3 months";
                break;
            case 7:
                return zoom + " 6 months";
                break;
            case 8:
                return zoom + " year";
                break;
            case 9:
                return zoom + " 2 years";
                break;
            case 10:
                return zoom + " 5 years";
                break;
        }
    }

    var setNewScaleGantChart = function (zoom) {
        if ((zoom == "+1") && (currentZoomValue < 10)) { currentZoomValue++; }
        if ((zoom == "-1") && (currentZoomValue > 1)) { currentZoomValue--; }
        setScaleConfigGantChart(currentZoomValue);
        gantChart.render();
        elZoomDiv.innerHTML = getScaleConfigNameGantChart(currentZoomValue);
    };


    //Initialisation Code

    setScaleConfigGantChart(8);
    elZoomDiv.innerHTML = getScaleConfigNameGantChart(currentZoomValue);

    gantChart.config.types["emptyrow"] = "emptyrow";
    gantChart.locale.labels["type_emptyrow"] = "Empty Row";
    gantChart.config.types["onerow"] = "onerow";
    gantChart.locale.labels["type_onerow"] = "One Row";
    gantChart.config.types["onerowformilestones"] = "onerowformilestones";
    gantChart.locale.labels["type_onerowformilestones"] = "One Row for Milestones";

    gantChart.templates.leftside_text = function (start, end, task) {
		console.log({task:task,start:start,end:end});
		
        var formatFunc = gantChart.date.date_to_str('%d/%m/%Y');
        var result = "";
        if (task.type == gantChart.config.types.task) {
            if ((task.leftside_text != null) && (task.leftside_text != undefined) && (task.leftside_text != "")) {
                result = task.leftside_text;
                result = (""+start)=="Invalid Date"?result.replace("{%PeriodStart}", "Unknown"):result.replace("{%PeriodStart}", formatFunc(start));
            }
        }
        return result;
    };
    gantChart.templates.rightside_text = function (start, end, task) {
        var formatFunc = gantChart.date.date_to_str('%d/%m/%Y');
        var result = "";
        if (task.type == gantChart.config.types.task) {
            if ((task.rightside_text != null) && (task.rightside_text != undefined) && (task.rightside_text != "")) {
                result = task.rightside_text;
                result = result.replace("{%PeriodEnd}", formatFunc(end));
            }
        } else if (task.type == gantChart.config.types.milestone) {
            result = task.text;
        }
        return result;
    };
    gantChart.config.start_date = new Date(1977, 10, 7);
    gantChart.config.end_date = new Date(2035, 4, 1);
    gantChart.templates.task_class = function (start, end, task) {
        if (task.type == gantChart.config.types.emptyrow) {
            return "emptyrow_task";
        } else if (task.type == gantChart.config.types.task) {
            return task.style;
        } else if (task.type == gantChart.config.types.milestone) {
            return task.style;
        }
        return "";
    };
    gantChart.templates.task_text = function (start, end, task) {
        if ((task.type == gantChart.config.types.emptyrow) || (task.type == gantChart.config.types.onerowformilestones) || (task.type == gantChart.config.types.onerow)) {
            return "";
        }
        return "<span>" + task.text + "</span>";
    };
    gantChart.templates.progress_text = function (start, end, task) {
        var sProgress = "";
        if ((task.progress != null) && (task.progress != undefined)) {
            sProgress = "<span style='text-align:left;'>" + task.progressIn100 + "% </span>";
        }
        return sProgress;
    };
    gantChart.config.columns = [
        {
            name: "text",
            label: "Name",
            tree: true,
            width: "*",
            resize: true
        }
    ];
    gantChart.templates.tooltip_date_format = function (date) {
        var formatFunc = gantChart.date.date_to_str('%d/%m/%Y');
        return formatFunc(date);
    };
    gantChart.templates.tooltip_text = function (start, end, task) {
        var formatFunc = gantChart.date.date_to_str('%d/%m/%Y');
        if ((task.type == gantChart.config.types.milestone) || (task.type == gantChart.config.types.task)) {
            var result = "";
            if ((task.tooltipformat != null) && (task.tooltipformat != undefined) && (task.tooltipformat != "")) {
                result = task.tooltipformat;
                result = result.replace("{%Name}", task.text);
                result = result.replace("{%Textingrid}", task.textingrid);
                result = result.replace("{%StartDate}", formatFunc(start));
                result = result.replace("{%EndDate}", formatFunc(end));
                result = result.replace("{%Duration}", task.duration);
                result = result.replace("{%Progress}", task.progressIn100);
                if ((task.tooltiptext != null) && (task.tooltiptext != undefined) && (task.tooltiptext != "")) {
                    result = result.replace("{%CustomText}", task.tooltiptext);
                }
            }
            return result;
        }
    };
    gantChart.config.readonly = true;
    gantChart.config.show_errors = false;
    gantChart.config.drag_links = false;
    gantChart.config.autosize = "y";
    gantChart.config.drag_progress = false;
	/*Fix error showing if no lifecycle on focus object*/
	gantChart._day_index_by_date = function (t) {
		var e = new Date(t).valueOf(),
		n = gantChart._tasks.trace_x,
		i = gantChart._tasks.ignore_x;
		e = e?e:0;
		if (e <= this._min_date)
			return 0;
		if (e >= this._max_date)
			return n.length;
		for (var a = gantChart._findBinary(n, e), s = +gantChart._tasks.trace_x[a]; i[s]; )
			s = gantChart._tasks.trace_x[++a];
		return s ? a + (t - n[a]) / gantChart._get_coll_duration(gantChart._tasks, n[a]) : 0
	};
    gantChart.init(ganttId);
    elZoomOut.onclick = function(){setNewScaleGantChart("+1")};
    elZoomIn.onclick = function(){setNewScaleGantChart("-1")};

    var xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           tasks = JSON.parse(xmlHttpRequest.responseText);
		   if (tasks && tasks.data && (tasks.data.length / 3) > 10){
			   elGanttContainer.style.height = "500px";
			   gantChart.config.autosize = "n";
		   }
           gantChart.parse(tasks);
           gantChart.render();
        }
    };
    xmlHttpRequest.open("GET", jsonUrl, true);
    xmlHttpRequest.send();

}