(function (global) {
    var gadgetId;
    function init(users, givenGadgetId) {
        gadgetId = givenGadgetId;
        getIssuesUserHasLoggedWorkOnToday(users);
        $("#weeksInPast").change(function () {
            $("#results tbody").empty();
            getIssuesUserHasLoggedWorkOnToday(users);
        });
    }

    function getFormattedDate(date) {
        var dd = date.getDate();
        var mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        return yyyy + "-" + mm + "-" + dd;
    }

    function calculateLoggedWorkSumOnGivenIssue(currentUser, issue) {
        return $.ajax({
            url: "https://jira.swisscom.com/rest/api/2/issue/" + issue.key + "/worklog",
            contentType: 'application/json',
            dataType: "json",
            success: function (worklogs) {
                var week = getWeek();

                if (worklogs.worklogs.length > 0) {

                    $.each(worklogs.worklogs, function (index, worklog) {
                        var started = new Date(worklog.started).getTime();
                        $.each(week, function (day, date) {
                            var tomorrow = new Date(date);
                            var sumLoggedWork = 0;
                            tomorrow.setDate(date.getDate() + 1);
                            if (started > date.getTime() && tomorrow.getTime() > started && worklog.author.name === currentUser) {
                                sumLoggedWork += worklog.timeSpentSeconds;
                            }
                            if (sumLoggedWork > 0) {
                                var cell = $("#" + day + "_" + currentUser);
                                cell.append('<span><a style="overflow: hidden; text-overflow: ellipsis;" target="_blank" href="/browse/' + issue.key + '">' + issue.fields.summary + ': ' + sumLoggedWork / 3600 + 'h</a></span><br/>');
                                AJS.$("#" + gadgetId + " iframe").css("height", $("html").css("height"));
                                AJS.$.each(parent.AG.DashboardManager.activeLayout.getGadgets(), function(index, gadget) {
                                    gadget.resize();
                                });
                            }
                        });
                    });
                }
            }
        });
    }

    function getWeek() {
        var today, todayNumber;
        today = new Date();
        var val = $("#weeksInPast").val();
        today.setDate(today.getDate() + (val * 7));
        todayNumber = today.getDay();
        return {
            monday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (1 - todayNumber)),
            tuesday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (2 - todayNumber)),
            wednesday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (3 - todayNumber)),
            thursday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (4 - todayNumber)),
            friday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (5 - todayNumber)),
            saturday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - todayNumber)),
            sunday: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - todayNumber))
        };
    }

    function getIssuesUserHasLoggedWorkOnToday(usernames) {
        var week = getWeek();
        var weeksInPast = $("#weeksInPast").val();
        $.each(usernames, function (index, username) {
            $("#results tbody").append("<tr id='" + username + "'><td>" + username + "</td><td id='monday_" + username + "'></td><td id='tuesday_" + username + "'></td><td id='wednesday_" + username + "'></td><td id='thursday_" + username + "'></td><td id='friday_" + username + "'></td><td id='saturday_" + username + "'></td><td id='sunday_" + username + "'></td></tr>");
            $.ajax({
                url: "http://jira.swisscom.com/rest/api/2/search?jql=issueFunction in workLogged('by " + username + " after startOfWeek(" + (weeksInPast - 1) + ") before endOfWeek(" + weeksInPast + ")')",
                contentType: 'application/json',
                dataType: "json",
                success: function (issues) {
                    $.each(issues.issues, function (index, issue) {
                        calculateLoggedWorkSumOnGivenIssue(username, issue);
                    });
                }
            });
        });
    }

    global.Report = {};
    Report.init = init;

})(window);
