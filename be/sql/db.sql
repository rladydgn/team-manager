create table user
(
    id            int auto_increment,
    nickname      varchar(50) null,
    email         varchar(50) null,
    provider      varchar(50) null,
    auth_id       int         not null,
    name          varchar(50) null,
    created_at    datetime    not null,
    updated_at    datetime    null,
    deleted_at    datetime    null,
    last_login_at datetime    null,
    constraint user_pk
        primary key (id)
);

create table team_category
(
    id         int auto_increment,
    name       varchar(50) not null,
    created_at datetime    not null,
    constraint team_category_pk
        primary key (id)
);

create table team
(
    id          int auto_increment,
    name        varchar(50) not null,
    category_id int         not null,
    constraint team_pk
        primary key (id),
    constraint team_name_uk
        unique (name)
);

create table `match`
(
    id             int auto_increment,
    home_team_id   int         not null,
    away_team_id   int         null,
    away_team_name varchar(50) null,
    match_at       datetime    null,
    created_at     datetime    not null,
    updated_at     datetime    null,
    deleted_at     datetime    null,
    constraint match_pk
        primary key (id)
);

create table payment
(
    id         int auto_increment
        primary key,
    is_paid    tinyint(1)  not null comment '지불 여부',
    team_id    int         null,
    user_id    int         null,
    match_id   int         null,
    name       varchar(50) not null comment '지불자 이름',
    category   varchar(20) not null comment '지불 종류(용병, 회원...)',
    created_at datetime    null,
    updated_at datetime    null,
    deleted_at datetime    null
);
