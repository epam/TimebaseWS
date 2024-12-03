/*
 * Copyright 2024 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.tbwg.webapp.security.oauth;

import com.epam.deltix.tbwg.webapp.services.authorization.TbwgUser;
import com.epam.deltix.tbwg.webapp.services.authorization.UsersProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class GatewayUserDetailsService implements UserDetailsService {

    private final UsersProvider usersProvider;

    @Autowired
    public GatewayUserDetailsService(UsersProvider usersProvider) {
        this.usersProvider = usersProvider;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.equals("")) {
            throw new IllegalArgumentException("Username cannot be blank.");
        }

        TbwgUser user = usersProvider.getUser(username);
        if (user != null) {
            return new User(user.getUsername(), "", user.getAuthorities());
        } else {
            return new User(username, "", new ArrayList<>());
        }
    }

}