import { Observable, Subject } from 'rxjs';

let createNavigator = (opts) => {
  let { stateObservable } = opts

  let subject = new Subject()
  let motionObservable
  let jumpObservable

  let possibleMotions = []
  let directions      = {}
  let slide           = {}

  /**
   * Maps motion-names to position in directions array
   *
   * @type {{
   *  left:  {level: number, direction: string},
   *  up:    {level: number, direction: string},
   *  right: {level: number, direction: string},
   *  down:  {level: number, direction: string}
   * }}
   */
  let motions = {
    left:  { level: 0, direction: 'previous' },
    up:    { level: 1, direction: 'previous' },
    right: { level: 0, direction: 'next' },
    down:  { level: 1, direction: 'next' }
  };

  let toPossibleMotions = (directions) => {
    let reduce  = (result, name) => {
      let motion = motions[name];
      result[name] = !!(directions[motion.level] && directions[motion.level][motion.direction]);
      return result;
    };

    return getMotionNames().reduce(reduce, {});
  };

  /**
   * Get motion display names
   * @returns {string[]} Array of possible motions (left, right, down, up)
   */
  let getMotionNames = () => {
    return Object.keys(motions);
  };

  /**
   * Is direction possible?
   * @param {string} motion
   * @returns {boolean}
   */
  let isPossibleMotion = (motion) => {
    return !!possibleMotions[motion];
  };

  let isValidMotion = (motion) => {
    return typeof motion === 'string' &&
      getMotionNames().indexOf(motion.toLowerCase()) !== -1;
  };

  let isJumpMotion = (motion) => {
    return Array.isArray(motion) && motion.reduce( (acc, i) => {
      return acc && !Number.isNaN( Number(i) );
    }, true);
  };

  let toNumericIndices = (motion) => {
    return motion.map( (i) => Number(i) );
  };

  /**
   * Is state valid?
   * Tests if state is an array.
   * @param {*} state
   * @returns {boolean}
   */
  let isValidState = (state) => {
    return Array.isArray(state);
  };

  /**
   * Get level and direction for motion-string
   * @param {string} direction
   * @returns {level, direction}
   */
  let toLevelAndDirection = (direction) => {
    return motions[direction];
  };

  /**
   * Returns new state from motion
   * @param {level, direction} motion
   * @returns {number[]|false}
   */
  let toState = (motion) => {
    return directions[motion.level] && directions[motion.level][motion.direction];
  };

  /**
   * Get subject to observe navigator changes
   * @returns {*}
   */
  let asObservable = () => {
    return Observable.merge(motionObservable, jumpObservable)
      .filter(isValidState)
  };

  // navigator.next("left");
  // navigator.next([0,1]);
  let next = (motion) => {
      subject.next(slide && slide.props[motion] || motion)
  };

  /*
   * Here's where the magic happens: Observability!
   */
  let motionUpdater = stateObservable
    .pluck('directions')
    .map(toPossibleMotions)
    .subscribe( (motions) => {
      possibleMotions = motions
    });

  let directionsUpdater = stateObservable
    .subscribe( (newState) => {
      directions = newState.directions
      slide      = newState.slide
    });

  let start = function() {
    subject = subject || new Subject();

    motionObservable = subject
      .filter(isValidMotion)
      .filter(isPossibleMotion)
      .map(toLevelAndDirection)
      .map(toState);

    jumpObservable = subject
      .filter(isJumpMotion)
      .map(toNumericIndices);
  };

  start();

  return {
    asObservable,
    isPossibleMotion,
    directions,
    motionNames: getMotionNames(),
    next,
    subject
  };
};

export default createNavigator;
