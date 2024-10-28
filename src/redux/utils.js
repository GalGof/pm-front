/** @template {BaseDBItem} T */
export function makeSliceParams()
{
  let initialState = {
    /** @type {string[]} */
    ids: [],
    /** @type {{[itemId: string]: T}} */
    entries: {},
  }
  let reducers = {
    /**
     * @param {typeof initialState}  state
     * @param {{payload: T[], type: string}} action
     * */
    initItems: (state, action) => {
      state.ids = action.payload.map(it=>it.id);
      state.entries = {};
      for (let it of action.payload) {
        state.entries[it.id] = it;
      }
    },
    /**
     * @param {typeof initialState}  state
     * @param {{payload: T, type: string}} action
     * */
    updateItem: (state, action) => {
      let id = action.payload.id;
      if (!state.entries[id]) {
        state.ids.unshift(id);
      }
      state.entries[id] = action.payload;
    },
    /**
     * @param {typeof initialState}  state
     * @param {{payload: string, type: string}} action
     * */
    deleteItem: (state, action) => {
      state.ids.splice(state.ids.indexOf(action.payload), 1);
      delete state.entries[action.payload];
    },
  }
  return {initialState, reducers}
}
