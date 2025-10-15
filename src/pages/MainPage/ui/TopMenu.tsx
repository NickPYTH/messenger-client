import { Flex, Input } from "antd"

const { Search } = Input;

export const TopMenu = () => {
    return(
        <Flex style={{width: '90%', padding: '5%'}} justify="center">
            <Search placeholder="Поиск" allowClear={true}/>
        </Flex>
    )
}