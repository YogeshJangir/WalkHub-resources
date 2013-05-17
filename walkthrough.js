Walkthrough = {};

(function ($) {

    // JavaScript -> Cocoa bridging

    function sendMessage(type, message) {
        $('<iframe />')
            .attr('src', 'walkthrough-' + type + '://localhost/?' + encodeURIComponent(message))
            .hide()
            .appendTo($('body'));
    }

    function stepCompleted() {
        sendMessage('stepcompleted');
    }

    function translator(command) {
        var locators = {
            'identifier':function (arg) {
                var jq = locators.id(arg);
                if (jq.length == 0) {
                    jq = locators.name(arg);
                }
                return jq;
            },
            'id':function (arg) {
                return $('#' + arg);
            },
            'name':function (arg) {
                return $('[name=' + arg + ']');
            },
            'dom':function (arg) {
            },
            'xpath':function (arg) {
                var result = document.evaluate(arg, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return $(result);
            },
            'link':function (arg) {
                arg = arg.replace('(', '\(').replace(')', '\)');
                return $('a:contains("' + arg + '")');
            },
            'ui':function (arg) {
            }
        };

        for (var prefix in locators) {
            if (command.indexOf(prefix + "=") === 0) {
                return locators[prefix](command.substr(prefix.length + 1));
            }
        }

        return $(command);
    }

    function sanitizeValue(value) {
        var types = {
            'label':function (arg) {
                return arg;
            }
        };

        for (var prefix in types) {
            if (value.indexOf(prefix + "=") === 0) {
                return types[prefix](value.substr(prefix.length + 1));
            }
        }

        return value;
    }

    var console = {
        'log':function (obj) {
            sendMessage('log', obj);
        }
    };

    var globalCounter = 0;

    function uniqueID() {
        return "px-walkthrough-" + globalCounter++;
    }

    var previousJoyride = null;

    function createJoyrideBoilerplate(element, command, modal) {

        var uniq = uniqueID();

        if (previousJoyride) {
            previousJoyride.joyride('end');
            previousJoyride.joyride('destroy');
        }

        if (element) {
            element.addClass(uniq);
        }


        previousJoyride = $('<ol />')
            .append(
            $('<li />')
                .html('<p>'.concat(command['description'], '</p>'))
                .attr('data-class', modal ? '' : uniq)
        )
            .hide()
            .appendTo($('body'))
            .joyride({
                'nextButton':true,
                'spareButton1':false
            });
 
            $('.joyride-spare-2')
            .unbind('click')
            .bind('click', function (event) {
                event.preventDefault();
                sendMessage('edit', '');
            })
            .html('Edit');

 
        $('.joyride-next-tip')
            .unbind('click')
            .bind('click', function (event) {
                event.preventDefault();
                sendMessage('next', '');
            })
            .html('Next');
 
    }

    function commandToString(command) {

        var description = command['description'];
        var prerequisites = command['prerequisites'];
        var postrequisites = command['postrequisites'];

        return description.concat()
    }

    // Dispatch command
    var commands = {
        "click":{
            'init':function (command) {
                translator(command['arg1'])
                    .unbind('click.walkthough')
                    .bind('click.walkthrough', stepCompleted);
            },
            'execute':function (command) {
                var element = translator(command['arg1']);
                var raw = element.get(0);
                raw.click();
            }
        },
        "type":{
            'init':function (command) {
                translator(command['arg1'])
                    .unbind('change.walkthrough')
                    .bind('change.walkthrough', function () {
                        stepCompleted();
                    });
            },
            'execute':function (command) {
                translator(command['arg1'])
                    .val(command['arg2'])
                    .change();
            }
        },
        "select":{
            'init':function (command) {
                translator(command['arg1'])
                    .unbind('change.walkthrough')
                    .bind('change.walkthrough', function () {
                        stepCompleted();
                    });
            },
            'execute':function (command) {
                translator(command['arg1'])
                    .val(sanitizeValue(command['arg2']))
                    .change();
            }
        }
    };

    /**
     * Executes a command
     *
     * @param command
     *    Object with the following keys:
     *    string title
     *    string description
     *    string command
     *    string pureCommand
     *    string arg1
     *    string arg2
     *    string highlight
     *    bool andWait
     * @param force
     */
    Walkthrough.execute = function (command, force) {
        // This is very important. This script runs synchronously, which means that if
        // something locks here, the whole app will freeze/deadlock.
        setTimeout(function () {
            if (commands[command['pureCommand']]) {
                commands[command['pureCommand']]['init'](command);
                if (command['highlight'] && !force) {
                    createJoyrideBoilerplate(translator(command['highlight']), command, false);
                } else {
                    commands[command['pureCommand']]['execute'](command);
                }
            }
        }, 0);
    };

    Walkthrough.modal = function (command, force) {
        // This is very important. This script runs synchronously, which means that if
        // something locks here, the whole app will freeze/deadlock.
        setTimeout(function () {
            createJoyrideBoilerplate(null, command, true);
        }, 0);
    };


})(jQuery);
