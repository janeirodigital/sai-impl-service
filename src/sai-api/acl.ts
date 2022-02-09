
export type ACL =
    | 'http://www.w3.org/ns/auth/acl#Read'
    | 'http://www.w3.org/ns/auth/acl#Write'
    | 'http://www.w3.org/ns/auth/acl#Update'
    | 'http://www.w3.org/ns/auth/acl#Create'
    | 'http://www.w3.org/ns/auth/acl#Delete'
    | 'http://www.w3.org/ns/auth/acl#Append';
