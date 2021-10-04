package com.epam.deltix.tbwg.services.oid;

public interface UserInfoService {

    String          getUsername(String token, String sub, long expirationTime);

}
