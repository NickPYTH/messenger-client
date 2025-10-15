import {FC, ReactNode} from "react";
import {Provider} from "react-redux";
import {setupStore} from "../../../store/store";

interface ReduxProviderProps {
  children: ReactNode;
}

const store = setupStore();

const ReduxProvider: FC<ReduxProviderProps> = (props) => {
    return (
        <Provider store={store}>
            {props.children}
        </Provider>
    )
}

export default ReduxProvider;