"use strict";


//tooltip text
$(document).ready(function () {

    $("body").on("mouseover", '.bar', function (event) {
        if (event.toElement.__data__.CourseName) {
            $('.tooltipTest').text(event.toElement.__data__.CourseName);
            $(".tooltipTest").css({
                "left": event.pageX - 50,
                "top": event.pageY - 40
            });
        }
        else if (currentDisplayedGraph == "Dept") {
            $('.tooltipTest').text("Department: "+event.toElement.__data__.Name +" & Attendance Percentage: "+ ((event.toElement.__data__.AverageAttendance)*100).toFixed(2)+"%");
            $(".tooltipTest").css({
                "left": event.pageX - 50,
                "top": event.pageY - 40
            });
        }
        else if (currentDisplayedGraph == "ModuleCode") {
            $('.tooltipTest').text("ModuleCode: "+event.toElement.__data__.Name +" & Attendance Percentage: "+((event.toElement.__data__.AverageAttendance)*100).toFixed(2)+"%");
            $(".tooltipTest").css({
                "left": event.pageX - 50,
                "top": event.pageY - 40
            });
        }
        else if (currentDisplayedGraph == "StudentID") {
            $('.tooltipTest').text("StudentID: "+event.toElement.__data__.Name +" & Marks: "+ event.toElement.__data__.AverageAttendance);
            $(".tooltipTest").css({
                "left": event.pageX - 50,
                "top": event.pageY - 40
            });
        }
        else if (currentDisplayedGraph == "end") {
            $('.tooltipTest').text(" ModuleCode: "+event.toElement.__data__.Name +" & Marks: "+ event.toElement.__data__.AverageAttendance);
            $(".tooltipTest").css({
                "left": event.pageX - 50,
                "top": event.pageY - 40
            });
        }
        
    });

    $('body').on("mouseout", '.bar', function (event) {
        $('.tooltipTest').text('');
    });
    //tooltip text


    // Graph position variables
    const margin = { top: 20, right: 20, bottom: 40, left: 100 };
    const width = 960 - margin.left - margin.right;
    const height = 570 - margin.top - margin.bottom;
    const percentFormat = d3.format('.0%');
    const leftPadding = 5;

    //Graph scaling properties
    const xScale = d3.scaleLinear()
        .range([0, width])
        .domain([0, 1]);
    const xScale1 = d3.scaleLinear()
        .range([0, width])
        .domain([0, 100]);

    const yScale = d3.scaleBand()
        .rangeRound([0, height], 0.1)
        .padding(0.1);

    const svg = d3.select('.chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    let departmentMetadata = []; // Contains complete information about department, course code and module attendance info
    let deptCourseCodeMappings = [];
    let moduleCodesAvgAttendancePercentages = [];
    let courseCodesAvgAttendancePercentages = [];
    let deptAvgAttendancePercentages = [];
    let departments = [];
    let nextGraphData = [];
    let currentDisplayedGraph = "";
    let selectedDepartmentId = "";
    let weekNums = [];

    let studentModuleResults = [];
    let moduleStudentResults = [];
    //Selected Bars
    let deptBar = "";
    let courseBar = "";
    let moduleBar = "";
    let studentBar = "";

    function extractDepartmentCourceModeMappings(data) {
        data.forEach(mapping => {
            deptCourseCodeMappings.push({
                DepartmentId: mapping.Department,
                CourseCode: mapping.CourseCode,
                CourseName: mapping.CourseName,
                GraduationType: mapping.CourseName.toUpperCase().startsWith("B") ? "UG" : "PG"
            })
        });
        departments = [...new Set(deptCourseCodeMappings.map(dept => dept.DepartmentId))].sort();
    }

    function extractDepartmentMetaData(refAttendanceData) {
        const attendanceData = refAttendanceData.filter(ad => ad.Status != "CC");
        const duplicateCourseCodes = attendanceData.map(el => el.CourseCode);
        const courseCodes = [...new Set(duplicateCourseCodes)].sort();
        for (let courseCode of courseCodes) {
            const ccOverallRecords = attendanceData.filter(cc => cc.CourseCode == courseCode);
            const ccModuleCCodes = [...new Set(ccOverallRecords.map(el => el.ModuleCode))].sort();

            //fetch department Id
            const deptInfo = deptCourseCodeMappings.filter(dept => dept.CourseCode == courseCode);
            if (deptInfo.length == 0) {
                console.log(`unmapped course codes ${courseCode}`);
                continue;
            }

            let totalCourseCodeAttendancePercentage = 0;
            for (let moduleCode of ccModuleCCodes) {
                let totalModuleAttendancePercentage = 0;
                const moduleOverallRecords = ccOverallRecords.filter(md => md.ModuleCode == moduleCode);
                const moduleClassDateTimes = [...new Set(moduleOverallRecords.map(dt => dt.classDateTime))].sort();
                for (let classDateTime of moduleClassDateTimes) {
                    const totalRecords = moduleOverallRecords.filter(cdt => cdt.classDateTime == classDateTime);
                    const presentedRecordsCount = totalRecords.filter(cdt => cdt.classDateTime == classDateTime && (cdt.Status === "P" || cdt.Status === "PDG" || cdt.Status === "O" || cdt.Status === "LAB")).length;

                    departmentMetadata.push({
                        DepartmentId: deptInfo[0].DepartmentId,
                        CourseName: deptInfo[0].CourseName,
                        GraduationType: deptInfo[0].GraduationType,
                        CourseCode: courseCode,
                        ModuleCode: moduleCode,
                        WeekNum: totalRecords[0].WeekNum,
                        ModuleStartTime: classDateTime,
                        TotalRecordsCount: totalRecords.length,
                        TotalPresentedRecordCount: presentedRecordsCount,
                        AttandancePercentage: parseFloat(totalRecords.length == 0 ? 0 : (presentedRecordsCount / totalRecords.length).toFixed(2))
                    });
                    totalModuleAttendancePercentage += totalRecords.length == 0 ? 0 : presentedRecordsCount / totalRecords.length;
                    if (!weekNums.includes(+totalRecords[0].WeekNum)) {
                        weekNums.push(+totalRecords[0].WeekNum);
                    }
                }

                // Push an entry for each module code avg attendance percentages 
                moduleCodesAvgAttendancePercentages.push({
                    DepartmentId: deptInfo[0].DepartmentId,
                    CourseName: deptInfo[0].CourseName,
                    CourseCode: courseCode,
                    GraduationType: deptInfo[0].GraduationType,
                    ModuleCode: moduleCode,
                    AverageAttendance: parseFloat((totalModuleAttendancePercentage / moduleClassDateTimes.length).toFixed(2))
                });
                totalCourseCodeAttendancePercentage += (totalModuleAttendancePercentage / moduleClassDateTimes.length);
            }

            // Push an entry for each course code avg attendance percentages 
            courseCodesAvgAttendancePercentages.push({
                DepartmentId: deptInfo[0].DepartmentId,
                CourseName: deptInfo[0].CourseName,
                CourseCode: courseCode,
                GraduationType: deptInfo[0].GraduationType,
                AverageAttendance: parseFloat((totalCourseCodeAttendancePercentage / ccModuleCCodes.length).toFixed(2))
            });
        }
        weekNums.sort((a, b) => a - b); //sort week numbers in ascending order
        //Add select dropdown options
        weekNums.forEach(num => {
            $("#slWeekNum").append(`<option> ${num} </option>`);
        });
        calculateDepartmentAvgAttendancePercentages();
    }

    //Calculate Departments Avg Attendance percentages
    function calculateDepartmentAvgAttendancePercentages() {
        deptAvgAttendancePercentages = [];
        for (let departmentId of departments) {
            let fiteredRecords = [];
            fiteredRecords = courseCodesAvgAttendancePercentages.filter(dept => dept.DepartmentId === departmentId);
            const courseCodesAvgAttendanceByDepartments = fiteredRecords.map(avg => parseFloat(avg.AverageAttendance));
            const totalAverages = courseCodesAvgAttendanceByDepartments.reduce((sum, el) => sum + el);
            deptAvgAttendancePercentages.push({
                DepartmentId: departmentId,
                AverageAttendance: parseFloat((totalAverages / fiteredRecords.length).toFixed(2))
            });
        }
    }

    function drawAttendancePercentageGraph(data) {
        d3.selectAll(".axis").remove();
        yScale.domain(data.map(y => y.Name));
        drawXAxis(svg);
        drawYAxis(svg);
        drawBars(svg, data);
    }

    function mouseClick(selectedBar) {

        $("#rbALL").prop('checked', true);

        $(".buttonDiv").on("click", function (event) {
            nextGraphData = [];
            currentDisplayedGraph = "Dept";
            deptAvgAttendancePercentages.forEach(dept => {
                nextGraphData.push({
                    Name: dept.DepartmentId,
                    AverageAttendance: dept.AverageAttendance
                });
            });
            drawAttendancePercentageGraph(nextGraphData);
            $(".buttonDiv").css("visibility", "hidden");
            $("#graduationTypeColor").css("visibility", "hidden");

        });
        if (currentDisplayedGraph == "Dept") {
            $(".buttonDiv").css("visibility", "visible");
            deptBar = selectedBar;
            selectedDepartmentId = selectedBar;
            nextGraphData = [];
            courseCodesAvgAttendancePercentages.filter(dept => dept.DepartmentId == selectedBar)
                .forEach(cc => {
                    nextGraphData.push({
                        Name: cc.CourseCode,
                        AverageAttendance: cc.AverageAttendance,
                        CourseName: cc.CourseName,
                        graduationType: cc.GraduationType
                    })
                });
            drawAttendancePercentageGraph(nextGraphData);
            currentDisplayedGraph = "CourseCode";
            $("#graphTitle").text(`Course Codes (Department: ${selectedBar}) Attendance Avg Percentages`);
            $("#graduationTypeColor").css("visibility", "visible");

        } else if (currentDisplayedGraph == "CourseCode") {
            nextGraphData = [];
            courseBar = selectedBar;
            moduleCodesAvgAttendancePercentages.filter(dept => dept.CourseCode == selectedBar)
                .forEach(mc => {
                    nextGraphData.push({
                        Name: mc.ModuleCode,
                        AverageAttendance: mc.AverageAttendance
                    })
                });
            drawAttendancePercentageGraph(nextGraphData);
            currentDisplayedGraph = "ModuleCode";
            $("#graduationType").css("visibility", "hidden");
            $("#graphTitle").text(`Module Codes (Course Code: ${selectedBar}) Attendance Avg Percentages`)
            $("#graduationTypeColor").css("visibility", "hidden");
            $(".buttonDiv").on("click", function () { currentDisplayedGraph = "Dept"; mouseClick(deptBar); });
            $(".buttonDiv").css("visibility", "visible");
        } else if (currentDisplayedGraph == "ModuleCode") {
            nextGraphData = [];
            moduleBar = selectedBar;
            let xyz = moduleStudentResults.filter(dept => dept.ModuleId == selectedBar);
            xyz = xyz[0].StudentResults;
            xyz.forEach(mc => {
                nextGraphData.push({
                    Name: mc.StudentID,
                    AverageAttendance: mc.Mark
                })
            });
            drawAttendancePercentageGraph(nextGraphData);
            currentDisplayedGraph = "StudentID";
            $("#graduationType").css("visibility", "hidden");
            $("#graphTitle").text(`Student IDs in (Module Code: ${selectedBar}) and Marks `)
            $(".buttonDiv").on("click", function () { currentDisplayedGraph = "CourseCode"; mouseClick(courseBar); });
            $(".buttonDiv").css("visibility", "visible");
        } else if (currentDisplayedGraph == "StudentID") {
            nextGraphData = [];
            let xyz = studentModuleResults.filter(dept => dept.StudentId == selectedBar);
            xyz = xyz[0].ModuleResults;
            xyz.forEach(mc => {
                nextGraphData.push({
                    Name: mc.ModuleCode,
                    AverageAttendance: mc.Mark
                })
            });
            drawAttendancePercentageGraph(nextGraphData);
            currentDisplayedGraph = "end";
            $("#graduationType").css("visibility", "hidden");
            $("#graphTitle").text(`Module IDs and  Marks for (StudentID: ${selectedBar})  `)
            $(".buttonDiv").on("click", function () { currentDisplayedGraph = "ModuleCode"; mouseClick(moduleBar); });
            $(".buttonDiv").css("visibility", "visible");
        }
    }

    const delay = function (d, i) {
        return i * 40;
    };

    function xAccessor(d) {
        return d.AverageAttendance;
    }

    function yAccessor(d) {
        return d.Name;
    }

    function drawXAxis(el) {
        el.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(${leftPadding},${height})`)
            .call((currentDisplayedGraph == "StudentID" || currentDisplayedGraph == "ModuleCode") ? d3.axisBottom(xScale1) : d3.axisBottom(xScale).tickFormat(percentFormat));
    }
    function drawYAxis(el, t) {
        let axis = el.select('.axis--y');
        if (axis.empty()) {
            axis = el.append('g')
                .attr('class', 'axis axis--y');
        }
        axis.transition(t)
            .call(d3.axisLeft(yScale))
            .selectAll('g')
            .delay(delay);
    }
    function drawBars(el, data, t) {
        let barsG = el.select('.bars-g');
        if (barsG.empty()) {
            barsG = el.append('g')
                .attr('class', 'bars-g');
        }

        const bars = barsG
            .selectAll('.bar')
            .data(data, yAccessor);
        bars.exit()
            .remove();
        bars.enter()
            .append('rect')
            .attr('class', d => d.graduationType === 'UG' ? 'bar wld' : 'bar')
            .attr('x', leftPadding)
            .merge(bars).transition(t)
            .attr('y', d => yScale(yAccessor(d)))
            .attr('width', d => (currentDisplayedGraph === "StudentID" || currentDisplayedGraph === "ModuleCode") ? xScale1(xAccessor(d)) : xScale(xAccessor(d)))
            .attr('height', yScale.bandwidth())
            .delay(delay);

        d3.selectAll('.bar').on("click", (d) => { if (currentDisplayedGraph != "end") { mouseClick(d.Name) } });
    }

    fetch('/pathways1.csv')
        .then(res => res.text())
        .then((res) => {
            extractDepartmentCourceModeMappings(d3.csvParse(res));
        });


    fetch('/att_module_results.json')
        .then(res => res.text())
        .then((res) => {
            extractModuleResults(JSON.parse(res).moduleResults);
        });

    fetch('/data_interactive.json')
        .then(res => res.text())
        .then((res) => {
            extractDepartmentMetaData(JSON.parse(res).attendanceData);
            currentDisplayedGraph = "Dept";
            nextGraphData = [];
            deptAvgAttendancePercentages.forEach(dept => {
                nextGraphData.push({
                    Name: dept.DepartmentId,
                    AverageAttendance: dept.AverageAttendance
                });
            });
            drawAttendancePercentageGraph(nextGraphData);
        });




    function extractModuleResults(attModuleResults) {

        const studentIds = [...new Set(attModuleResults.map(sid => sid.StuduentID))].sort();
        for (let studentId of studentIds) {
            const studentModuleResultsRecords = attModuleResults.filter(sid => sid.StuduentID === studentId);

            let moduleResults = [];
            for (let moduleResultRecord of studentModuleResultsRecords) {
                moduleResults.push({
                    ModuleCode: moduleResultRecord.ModuleCode,
                    Mark: moduleResultRecord.Mark,
                    Grade: moduleResultRecord.Grade
                });
            }

            studentModuleResults.push({
                StudentId: studentId,
                ModuleResults: moduleResults
            });
        }

        const moduleIds = [...new Set(attModuleResults.map(mid => mid.ModuleCode))];
        for (let moduleId of moduleIds) {
            const moduleStudentResultsRecords = attModuleResults.filter(mid => mid.ModuleCode === moduleId);
            let studentResults = [];
            for (let studentResultRecord of moduleStudentResultsRecords) {
                studentResults.push({
                    StudentID: studentResultRecord.StuduentID,
                    Mark: studentResultRecord.Mark,
                    Grade: studentResultRecord.Grade
                });
            }
            moduleStudentResults.push({
                ModuleId: moduleId,
                StudentResults: studentResults
            });
        }
    }

})

