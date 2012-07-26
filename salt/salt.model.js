/*
Ozgur Yuksel, July, 2012
    
*/
define(['salt.base', 'salt.event'], function(salt) {
    salt.model = {
        //update the source object with the values from target object
        //call is not propagated, values are simply copied. 
        //returns a tuple as boolean flags [changed, newKey]
        update: function(source, target) {
            var changed = false;
            var newKey = false;
            for (key in target) {
                if ((key in source))
                    changed = (source[key] != target[key]);
                else
                    newKey = true;
                source[key] = target[key];
            }
            return [changed || newKey, newKey];
        }

        , push: function(source, item) {
            source.push(item);
            return [true, true];
        }

        //This remove method is not provided by the Array, it is adapted from
        //http://ejohn.org/blog/javascript-array-remove/
        //TODO: A version of remove should be provided for dictionary objects to remove
        //the key value pairs from
        , remove: function(source, item) {
            var from = source.indexOf(item);
            if (from < 0)
                return [false, false];
            var to = from; //only one element will be removed
            var rest = source.slice((to || from) + 1 || source.length);
            source.length = from; //cuts the rest of the element
            source.push.apply(source, rest); //and insterts it back
            return [true, true];
        }
    };

    salt.Data = function(data) { this.update(data) };
    salt.Data.prototype.update = function(target) {
        var res = salt.model.update(this, target);
        if (res[0])
            this.trigger('changed', this);
    }

    salt.Data.prototype.bind = function(params) {
        params.source = this;
        salt.event.bind(params);
        if (params.trigger && params.event == 'changed') {
            var method = params.method;
            method(this);
        }
    }

    salt.Data.prototype.unbind = function(event, method) {
        salt.event.unbind(this, event, method);
    }

    salt.Data.prototype.trigger = function(event, data) {
        salt.event.trigger(this, event, data);
    }

    salt.Array = function(data) {
        for (var idx in data)
            this.push(data[idx]);
    };
    salt.inherit(salt.Array, Array);

    salt.Array.prototype.push = function(item) {
        Array.prototype.push.call(this, item);
        if (item.bind) {
            var _this = this;
            //TODO: Once the event mechanism support method owner we can 
            //remove this hack
            if (!this.saltItemChangedHandler)
                this.saltItemChangedHandler = function(value) {_this.trigger('changed', _this);}
            item.bind({ event: 'changed', method: this.saltItemChangedHandler });
        }
        this.trigger('added', item);
    }

    salt.Array.prototype.remove = function(item) {
        var res = salt.model.remove(this, item);
        if (item.bind)
            item.unbind('changed', this.saltItemChangedHandler);
        if (res[0])
            this.trigger('removed', item);
    }

    salt.Array.prototype.bind = function(params) {
        params.source = this;
        salt.event.bind(params);
        if (params.trigger && params.event == 'added') {
            var method = params.method;
            for (var idx = 0; idx < this.length; idx++)
                method(this[idx]);
        }
    }

    salt.Array.prototype.unbind = function(event, method) {
        salt.event.unbind(this, event, method);
    }

    salt.Array.prototype.trigger = function(event, data) {
        salt.event.trigger(this, event, data);
    }



    return salt;
});
