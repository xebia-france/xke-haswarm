import * as constants from '../constants.js'
import * as actions from '../actions'
import {combineReducers} from 'redux';

const defaultService = {
    countBuffer: 0,
    countRing: new Array(10).fill(0),
    name: "",
    filename: "",
    hostname: ""
};

const initialState = {
    ringOffset: 0,
    services: {},
    isMonitor: false
};

var ringSize = (1000 / constants.RING_RESOLUTION);
function serviceReducer(state = defaultService, action, ringOffset) {
    switch (action.type) {
        case actions.SERVICE_HIT:
            var assign = Object.assign({}, state, {
                countBuffer: state.countBuffer + 1
            });
            return assign;
        case actions.SERVICE_RECEIVED:
            return Object.assign({}, state, {
                hostname: action.hostname,
                filename: action.identity.filename,
                name: action.name,
                countBuffer: 0
            });

        case actions.RING_TICK:
            return Object.assign({}, state, {
                countRing: Object.assign([], state.countRing, {
                    [ringOffset]: state.countBuffer
                }),
                countBuffer: 0
            });
        default:
            return state
    }
}

function rootReducer(state = initialState, action) {
    switch (action.type) {
        case actions.SERVICE_HIT:
            return Object.assign({}, state, {
                services: Object.assign({}, state.services, {
                    [action.name]: serviceReducer(state.services[action.name], action, state.ringOffset)
                })
            });
        case actions.SERVICE_HIT_PENDING:
            return Object.assign({}, state, {
                hitPending: true
            });
        case actions.SERVICE_HIT_COMPLETED:
            return Object.assign({}, state, {
                hitPending: false
            });
        case actions.SERVICE_RECEIVED:

            var services = {};
            action.services.forEach(s => {
                services[s.identity.name] = {
                    countBuffer: 0,
                    countRing: new Array(10).fill(0),
                    hostname: s.hostname + "." + s.domainname,
                    name: s.identity.name,
                    filename: s.identity.filename
                }
            });
            return Object.assign({}, state, {
                services: services
            });

        case actions.RING_TICK:

            var newOffset = (state.ringOffset + 1) % ringSize;
            return Object.assign({}, state, {
                ringOffset: newOffset,
                services: Object.keys(state.services).reduce((newObj, key) => {
                    newObj[key] = serviceReducer(state.services[key], action, newOffset);
                    return newObj;
                }, {})
            });
        default:
            return state
    }
}

export default rootReducer