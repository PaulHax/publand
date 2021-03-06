/* eslint-disable @typescript-eslint/no-empty-function */
import * as AFrame from 'aframe';
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// helpers

/***
 * @hidden
 */
const hasMethod = (obj: {}, name: string) => {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
    return !!desc && typeof desc.value === 'function';
};

/***
 * @hidden
 */
const getInstanceMethodNames = (obj: {}, stop: {}) => {
    const array: string[] = [];
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== stop) {
        Object.getOwnPropertyNames(proto).forEach(name => {
            if (name !== 'constructor') {
                if (hasMethod(proto, name)) {
                    array.push(name);
                }
            }
        });
        proto = Object.getPrototypeOf(proto);
    }
    return array;
};

/**
 * Extend this class to create strongly typed A-Frame components.
 * Default implementations for component lifecycle methods such as init(), tick(), and others are provided,
 * and can be overridden for your component's specific behavior.
 */

export abstract class ComponentWrapper<SCHEMA extends object = {}, SYSTEM extends AFrame.System = AFrame.System>
    implements AFrame.Component<SCHEMA, SYSTEM> {
    el: AFrame.Entity;
    id: string;
    data: SCHEMA;
    schema: AFrame.Schema<SCHEMA>;
    system: SYSTEM;
    name: string;

    constructor(schema?: AFrame.Schema<SCHEMA>) {
        this.schema = schema || {};
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // default aframe core function implementations

    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_remove.
     */
    remove() {}
    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_update.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(oldData: {}) {}
    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_updateschema.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extendSchema(update: {}) {}
    flushToDOM() {}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // default aframe core function implementations

    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_init.
     */
    init() {}
    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_pause.
     */
    pause() {}
    /**
     * Wraps https://aframe.io/docs/0.8.0/core/component.html#definition_lifecycle_handler_methods_play.
     */
    play() {}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // special wrapper functions implementations

    /***
     * @hidden
     */
    merge() {
        const funcs = getInstanceMethodNames(this, Object.prototype);
        funcs.forEach(k => (this[k] = this[k]));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // special wrapper functions implementations

    // destroy() {
    //     const parent = this.el.parentElement
    //     if (!!parent) {
    //         parent.removeChild(this.el)
    //     }
    // }
    destroy() {}

    registerComponent(name: string) {
        // unregister any existing component
        this.name = name;
        if (AFrame.components[this.name]) {
            console.log(`WARNING -- unregistering already registered component with name "${this.name}".`);
            delete AFrame.components[this.name];
        }

        this.merge();
        AFrame.registerComponent(this.name, this);

        return this;
    }

    registerCallback(callbackName: string, fn: Function) {
        this.el.addEventListener(callbackName, fn.bind(this));
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class SystemWrapper<SCHEMA extends { [key: string]: any } = {}> implements AFrame.System {
    data: SCHEMA;
    schema: AFrame.Schema<SCHEMA>;
    name: string;

    constructor(name: string, schema?: AFrame.Schema<SCHEMA>) {
        this.name = name;
        this.schema = schema || {};
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // default aframe core function implementations

    init() {}
    pause() {}
    play() {}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // special wrapper functions implementations

    /***
     * @hidden
     */
    merge() {
        const funcs = getInstanceMethodNames(this, Object.prototype);
        funcs.forEach(k => (this[k] = this[k]));
    }

    register() {
        this.merge();
        AFRAME.registerSystem(this.name, this);
    }
}
