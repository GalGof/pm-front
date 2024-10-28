type ReactState<T> = [T, React.Dispatch<React.SetStateAction<T>>]

type ReduxStoreType = import("./storeProxy.d.ts").ReduxStoreType