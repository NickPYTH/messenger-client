import {Avatar, Flex, Input} from "antd"
import {useState} from "react";
import { ProfileModal } from "../ProfileModal";

const { Search } = Input;

export const TopMenu = () => {

    // States
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    // -----

    return(
        <Flex style={{padding: 7}} justify="space-between" align={"center"}>
            {isProfileModalVisible && <ProfileModal visible={isProfileModalVisible} setVisible={setIsProfileModalVisible}/>}
            <Avatar onClick={() => setIsProfileModalVisible(true)} style={{minWidth: 40, cursor: 'pointer'}} src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg" size={'large'}/>
            <Search style={{marginLeft: 5}} placeholder="Поиск" allowClear={true}/>
        </Flex>
    )
}