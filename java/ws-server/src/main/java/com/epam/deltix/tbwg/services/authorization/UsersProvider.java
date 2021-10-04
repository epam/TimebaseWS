package com.epam.deltix.tbwg.services.authorization;

import java.util.List;

public interface UsersProvider {

    TbwgUser            getUser(String username);

    List<TbwgUser>      getUsers();

}
