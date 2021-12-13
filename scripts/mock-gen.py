import random
import uuid

user_number = 100
study_number = 10
comment_number = 100
noti_number = 20
study_user_number = 300
bookmark_number = 50

user_ids = [str(uuid.uuid4()) for i in range(user_number)]
study_ids = [str(uuid.uuid4()) for i in range(study_number)]
comment_ids = [str(uuid.uuid4()) for i in range(comment_number)]
noti_ids = [str(uuid.uuid4()) for i in range(noti_number)]

def make_user_insert_statement(id, email, password, is_logout, token):
    return f'''INSERT INTO USER(ID, EMAIL, PASSWORD, IS_LOGOUT, TOKEN, ROLE) VALUES ('{id}', '{email}', '{password}', {is_logout}, '{token}', 'GUEST');\n'''

def make_user_profile_insert_statement(id, user_name, dept, grade, bio, user_about, show_dept, show_grade, show_about, on_break, email1, email2, email3, link1, link2):
    return f'''INSERT INTO UserProfile(ID, USER_NAME, DEPT, GRADE, BIO, USER_ABOUT, SHOW_DEPT, SHOW_GRADE, SHOW_ABOUT, ON_BREAK, EMAIL1, EMAIL2, EMAIL3, LINK1, LINK2)
VALUES('{id}', '{user_name}', '{dept}', '{grade}', '{bio}', '{user_about}', {show_dept}, {show_grade}, {show_about}, on_break, '{email1}', '{email2}', '{email3}', '{link1}', '{link2}');\n'''

def make_study_insert_statement(id, created_at, title, study_about, time, weekday, frequency, location, capacity, members_count, vacancy, is_open, views, host_id):
    return f'''INSERT INTO STUDY(STUDY_ID, CREATED_AT, TITLE, STUDY_ABOUT, WEEKDAY, FREQUENCY, LOCATION, CAPACITY, MEMBERS_COUNT, VACANCY, IS_OPEN, CATEGORY_CODE, VIEWS, HOST_ID)
VALUES('{id}', '{created_at}', '{title}', '{study_about}', '{time}', '{weekday}', '{frequency}', '{location}', '{capacity}', '{members_count}', '{vacancy}', '{is_open}', {views}, '{host_id}');\n'''

def make_studyuser_insert_statement(user_id, study_id):
    return f'''INSERT INTO STUDY_USER(uSERID, sTUDYSTUDYID) VALUES('{user_id}', '{study_id}');\n'''

def make_bookmark_insert_statement(user_id, study_id):
    return f'''INSERT INTO BOOKMARK(uSERID, sTUDYSTUDYID) VALUES('{user_id}', '{study_id}');\n'''

def make_comment_insert_statement(id, user_id, study_id, content):
    return f'''INSERT INTO COMMENT(ID, parentCommentId, USER_ID, STUDY_ID, IS_NESTED, CONTENT)
VALUES('{id}', NULL, '{user_id}', '{study_id}', 0, '{content}');\n'''

# reset script
with open('reset.sql', 'w') as f:
    f.write('DELETE FROM COMMENT;')
    f.write('DELETE FROM NOTIFICATION;')
    f.write('DELETE FROM BOOKMARK;')
    f.write('DELETE FROM STUDY_USER;')
    f.write('DELETE FROM STUDY;')
    f.write('DELETE FROM UserProfile;')
    f.write('DELETE FROM USER_INTEREST_CATEGORY;')
    f.write('DELETE FROM USER_METOO_COMMENT;')
    f.write('DELETE FROM USER;')
    f.write('DELETE FROM CATEGORY;')
    f.write('source userdata.sql;')
    f.write('source studydata.sql;')
    f.write('source userprofiledata.sql;')
    f.write('source studyuserdata.sql;')
    f.write('source bookmarkdata.sql;')
    f.write('source commentdata.sql;')
    f.write('source notificationdata.sql;')
    f.write('INSERT INTO CATEGORY(CODE, MAIN, SUB) VALUES(100, \'프로그래밍\', \'c/c++\'), (101, \'프로그래밍\', \'자바스크립트\'), (200, \'어학\', \'토익\'), (201, \'어학\', \'토플\');')
    f.write('source userinterestcategorydata.sql;')
    f.write('source usermetoocommentdata.sql;')

# user table
with open('userdata.sql', 'w') as f:
    for i in range(user_number):
        stmt = make_user_insert_statement(user_ids[i], f'user{i}@test.com', f'password{i}', 0, f'token{i}')
        f.write(stmt)

# user_profile table
with open('userprofiledata.sql', 'w') as f:
    for i in range(user_number):
        stmt = make_user_profile_insert_statement(user_ids[i], f'user{i}', 'dept', 'grade', 'bio',
                f'user{i}\\\'s about', 0, 0, 0, 0, 'email1', 'email2', 'email3', 'link1', 'link2')
        f.write(stmt)

# study table
with open('studydata.sql', 'w') as f:
    for i in range(study_number):
        stmt = make_study_insert_statement(study_ids[i], '2021-12-{}'.format(20 - random.randint(1, 19)),
                f'study{i}', f'study{i}\\\'s content', 0, 0, 0, 0, 0, 0, 0, 0, 0, user_ids[i // study_number])
        f.write(stmt)

# study_user table
with open('studyuserdata.sql', 'w') as f:
    for i in range(study_user_number):
        user = random.randint(0, user_number - 1)
        study = random.randint(0, study_number - 1)
        stmt = make_studyuser_insert_statement(user_ids[user], study_ids[study])
        f.write(stmt)

# bookmark table
with open('bookmarkdata.sql', 'w') as f:
    for i in range(bookmark_number):
        user = random.randint(0, user_number - 1)
        study = random.randint(0, study_number - 1)
        stmt = make_bookmark_insert_statement(user_ids[user], study_ids[study])
        f.write(stmt)

# comment table
with open('commentdata.sql', 'w') as f:
    for i in range(comment_number):
        stmt = make_comment_insert_statement(comment_ids[i],
                user_ids[i], study_ids[i // study_number], f'comment content {i}')
        f.write(stmt)

# user_interest_category table
with open('userinterestcategorydata.sql', 'w') as f:
    stmt = f'''INSERT INTO USER_INTEREST_CATEGORY(uSERID, cATEGORYCODE)
VALUES ('{user_ids[0]}', 100), ('{user_ids[0]}', 101), ('{user_ids[1]}', 100), ('{user_ids[2]}', 200);'''
    f.write(stmt)

# notification table
with open('notificationdata.sql', 'w') as f:
    for i in range(noti_number):
        stmt = f'''INSERT INTO NOTIFICATION(ID, USER_ID, STUDY_ID, TYPE, `READ`)
VALUES ('{noti_ids[i]}', '{user_ids[i // 5]}', '{study_ids[i // 5]}', 0, 0);'''
        f.write(stmt)

# user_metoo_comment table
with open('usermetoocommentdata.sql', 'w') as f:
    for i in range(noti_number): # comment_number > noti_number
        stmt = f'''INSERT INTO USER_METOO_COMMENT(USERID, COMMENTID)
VALUES('{user_ids[i // (user_number // comment_number)]}', '{comment_ids[i]}');'''
        f.write(stmt)
