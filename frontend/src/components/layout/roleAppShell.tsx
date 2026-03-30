"use client";

import { MenuOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Drawer, Layout, Menu, Space, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/auth/logoutButton";
import { useRoleShellStyles } from "@/components/layout/style";

const { Header, Content } = Layout;

export interface IRoleSidebarItem {
    key: string;
    label: string;
    href: string;
}

interface IRoleAppShellProps {
    roleLabel: string;
    activeKey?: string;
    items: IRoleSidebarItem[];
    children: React.ReactNode;
}

const TopNavigation = ({ roleLabel, activeKey, items }: Pick<IRoleAppShellProps, "roleLabel" | "activeKey" | "items">) => {
    const { styles } = useRoleShellStyles();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navigationItems = useMemo(
        () =>
            items.map((item) => ({
                key: item.key,
                label: <Link href={item.href}>{item.label}</Link>,
            })),
        [items]
    );

    return (
        <Header className={styles.topHeader}>
            <div className={styles.headerInner}>
                <div className={styles.brandBlock} aria-label={`MedStream ${roleLabel} workspace`}>
                    <span className={styles.brandMark} aria-hidden>
                        <Image src="/logo_inverted.png" alt="" width={38} height={38} />
                    </span>
                    <span className={styles.brandText}>
                        Med<span className={styles.brandAccent}>Stream</span>
                    </span>
                </div>

                {navigationItems.length > 0 ? (
                    <Menu mode="horizontal" selectedKeys={activeKey ? [activeKey] : []} className={styles.topMenu} items={navigationItems} />
                ) : (
                    <div className={styles.menuSpacer} />
                )}

                <Space size={10} className={styles.actionArea}>
                    <Avatar icon={<UserOutlined />} className={styles.profileAvatar} />
                    <Typography.Text className={styles.roleLabel}>{roleLabel}</Typography.Text>
                    <LogoutButton className={styles.logoutButton} />
                </Space>

                <Button type="text" className={styles.mobileMenuButton} icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setIsDrawerOpen(true)} />
            </div>

            <Drawer title="Navigation" placement="right" open={isDrawerOpen} size="default" onClose={() => setIsDrawerOpen(false)} className={styles.mobileDrawer}>
                {navigationItems.length > 0 ? <Menu mode="inline" selectedKeys={activeKey ? [activeKey] : []} items={navigationItems} /> : null}
                <div className={styles.mobileDrawerFooter}>
                    <Typography.Text type="secondary">Signed in as {roleLabel}</Typography.Text>
                    <LogoutButton className={styles.mobileLogoutButton} />
                </div>
            </Drawer>
        </Header>
    );
};

export const RoleAppShell = ({ roleLabel, activeKey, items, children }: IRoleAppShellProps) => {
    const { styles } = useRoleShellStyles();

    return (
        <Layout className={styles.root}>
            <TopNavigation roleLabel={roleLabel} activeKey={activeKey} items={items} />
            <Content className={styles.content}>
                <div className={styles.contentInner}>{children}</div>
            </Content>
        </Layout>
    );
};
