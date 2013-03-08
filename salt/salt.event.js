/*
Ozgur Yuksel, July, 2012
    
*/


define(['salt/salt.base', 'salt/salt.model'], function(salt) {
    salt.event = {
        /*params is a dictionaty object which contains:
        source: source object which will trigger the event
        event: name of the event to be bind
        method: method to be called
        listener: (optional) listener object, if given, it will be the "this" for the event method
        trigger: (optional) trigger the event at the time of binding or not
        */
        bind: function(params) {
            source = params.source;
            event = params.event;
            method = params.method;
            source.salt = source.salt || {};
            source.salt.listeners = source.salt.listeners || {};
            source.salt.listeners[event] = source.salt.listeners[event] || [];
            source.salt.listeners[event].push(method);
        }

        , unbind: function(src, event, method) {
            try {
                if (!method) {
                    src.salt.listeners[event] = [];
                }
                else {
                    salt.model.remove(src.salt.listeners[event], method);
                }
            }
            catch (e) {
            }
        }

        , trigger: function(src, event, data) {
            try 
            {
                $.each(src.salt.listeners[event], function(idx, method) {
                    method(data);
                });
            }
            catch (e) {
                //console.log(e);
            }
                
        }
    };

    //Extend salt.model methods so they trigger events
    //TODO: This is most likely not a good idea, we don't need to override and forward calls,
    //I just wanted to see how I can modify the behavior of an existing object by wrapping it
    //without changing itself [ozgur]
    var saltModel = salt.model;
    salt.model = {
        update: function(source, target) {
            var res = saltModel.update(source, target);
            return res;
        }
        , push: function(source, item) {
            var res = saltModel.push(source, item);
            if (res[0])
                salt.event.trigger(source, 'change', source);
            if (res[1])
                salt.event.trigger(source, 'push', item);
            return res;
        }
        , remove: function(source, item) {
            var res = saltModel.remove(source, item);
            if (res[0])
                salt.event.trigger(source, 'change', source);
            if (res[1])
                salt.event.trigger(source, 'remove', item);
            return res;
        }
    };


    return salt;
});
