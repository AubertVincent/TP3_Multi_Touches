import { FSM } from "./FSM";
import * as transfo from "./transfo";
import {drag, getMatrixFromElement, getPoint, rotozoom} from "./transfo";

function multiTouch(element: HTMLElement) : void {
    let pointerId_1 : number, Pt1_coord_element : SVGPoint, Pt1_coord_parent : SVGPoint,
        pointerId_2 : number, Pt2_coord_element : SVGPoint, Pt2_coord_parent : SVGPoint,
        originalMatrix : SVGMatrix,
        getRelevantDataFromEvent = (evt : TouchEvent) : Touch => {
            for(let i=0; i<evt.changedTouches.length; i++) {
                let touch = evt.changedTouches.item(i);
                if(touch.identifier === pointerId_1 || touch.identifier === pointerId_2) {
                    return touch;
                }
            }
            return null;
        };
    enum MT_STATES {Inactive, Translating, Rotozooming}
    let fsm = FSM.parse<MT_STATES>( {
        initialState: MT_STATES.Inactive,
        states: [MT_STATES.Inactive, MT_STATES.Translating, MT_STATES.Rotozooming],
        transitions : [
            { from: MT_STATES.Inactive, to: MT_STATES.Translating,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                    pointerId_1 =0;
                    let touch1 = evt.changedTouches[0];
                    Pt1_coord_parent = getPoint(touch1.pageX,touch1.pageY);
                    originalMatrix = getMatrixFromElement(element);
                    Pt1_coord_element = Pt1_coord_parent.matrixTransform(originalMatrix.inverse());

                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    let touch1 = evt.changedTouches[0];
                    Pt1_coord_parent = Pt1_coord_parent = getPoint(touch1.pageX,touch1.pageY);
                    drag(element,originalMatrix,Pt1_coord_element,Pt1_coord_parent);
                    return true;
                }
            },
            { from: MT_STATES.Translating,
                to: MT_STATES.Inactive,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    // To be completed

                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Rotozooming,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                    pointerId_2 =1;
                    let touch2 = evt.changedTouches[0];
                    Pt2_coord_parent = getPoint(touch2.pageX,touch2.pageY);
                    originalMatrix = getMatrixFromElement(element);
                    Pt2_coord_element = Pt2_coord_parent.matrixTransform(originalMatrix.inverse());
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming, to: MT_STATES.Rotozooming,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    console.log(evt.changedTouches);
                    if(evt.changedTouches.length === 2) {
                        let touch1 = evt.changedTouches[0];
                        let touch2 = evt.changedTouches[1];
                        if(touch1.identifier === pointerId_1) {
                            Pt1_coord_parent = getPoint(touch1.pageX, touch1.pageY);
                            Pt2_coord_parent = getPoint(touch2.pageX, touch2.pageY);
                        }else if(touch1.identifier === pointerId_2) {
                            Pt1_coord_parent = getPoint(touch2.pageX, touch2.pageY);
                            Pt2_coord_parent = getPoint(touch1.pageX, touch1.pageY);
                        }
                    }else if (evt.changedTouches.length === 1) {
                        let touch :Touch = evt.changedTouches[0];
                        if(touch.identifier === pointerId_1) {
                            Pt1_coord_parent = getPoint(touch.pageX, touch.pageY);
                        }else if (touch.identifier === pointerId_2) {
                            Pt2_coord_parent = getPoint(touch.pageX, touch.pageY);
                        }
                    }
                    rotozoom(element, originalMatrix, Pt1_coord_element, Pt1_coord_parent, Pt2_coord_element, Pt2_coord_parent);
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming,
                to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    console.log(evt.changedTouches[0]);
                    let touch1 = evt.changedTouches[0];
                    if(touch1.identifier === pointerId_1) {
                        Pt1_coord_parent = Pt2_coord_parent;
                        pointerId_1 = pointerId_2;
                    }
                    Pt1_coord_element = Pt1_coord_parent.matrixTransform(originalMatrix.inverse());
                    return true;
                }
            }
        ]
    } );
    fsm.start();
}

//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
function isString(s : any) : boolean {
    return typeof(s) === "string" || s instanceof String;
}

export let $ = (sel : string | Element | Element[]) : void => {
    let L : Element[] = [];
    if( isString(sel) ) {
        L = Array.from( document.querySelectorAll(<string>sel) );
    } else if(sel instanceof Element) {
        L.push( sel );
    } else if(sel instanceof Array) {
        L = sel;
    }
    L.forEach( multiTouch );
};
