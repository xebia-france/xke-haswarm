import * as actions from '../actions'
import {combineReducers} from 'redux';

const defaultService = {
    countBuffer: 0,
    countRing: new Array(10).fill(0),
    name: "",
    url: ""
};

const ringSize = 100;

function serviceReducer(state = defaultService, action, ringOffset) {
    var newRing;
    switch (action.type) {
        case actions.SERVICE_HIT:
            return Object.assign({}, state, {
                countBuffer: state.countBuffer + 1
            });
        case actions.RING_TICK:
            newRing = state.countRing.slice();
            newRing[ringOffset] = state.countBuffer;

            return Object.assign({}, state, {
                countRing: newRing,
                countBuffer: 0
            });
        default:
            return state
    }
}

function rootReducer(state, action) {
    switch (action.type) {
        case actions.SERVICE_HIT:
            return Object.assign({}, state, {
                services: Object.assign({}, state.services, {
                    [action.service]: serviceReducer(state.services[action.service], action, state.ringOffset)
                })
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