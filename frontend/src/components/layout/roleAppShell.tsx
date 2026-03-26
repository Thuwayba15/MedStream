"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Drawer, Layout, Menu, Space, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logoutButton";
import { useRoleShellStyles } from "@/components/layout/style";

const { Sider, Content } = Layout;

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

function SidebarContent({ roleLabel, activeKey, items }: Pick<IRoleAppShellProps, "roleLabel" | "activeKey" | "items">): React.JSX.Element {
    const { styles } = useRoleShellStyles();

    return (
        <div className={styles.sidebar}>
            <div className={styles.brandBlock} aria-label="MedStream">
                <span className={styles.brandMark} aria-hidden>
                    <Image src="/logo_inverted.png" alt="" width={32} height={32} />
                </span>
                <span className={styles.brandText}>
                    Med<span className={styles.brandAccent}>Stream</span>
                </span>
            </div>

            <Tag className={styles.roleChip}>{roleLabel}</Tag>

            {items.length > 0 ? (
                <Menu
                    mode="inline"
                    selectedKeys={activeKey ? [activeKey] : []}
                    className={styles.sidebarMenu}
                    items={items.map((item) => ({
                        key: item.key,
                        label: <Link href={item.href}>{item.label}</Link>,
                    }))}
                />
            ) : null}

            <div className={styles.logoutWrap}>
                <LogoutButton />
            </div>
        </div>
    );
}

export function RoleAppShell({ roleLabel, activeKey, items, children }: IRoleAppShellProps): React.JSX.Element {
    const { styles } = useRoleShellStyles();
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <Layout className={styles.root}>
            <Sider breakpoint="md" width={286} collapsedWidth={0} theme="dark" trigger={null} collapsible className={styles.desktopSider}>
                <SidebarContent roleLabel={roleLabel} activeKey={activeKey} items={items} />
            </Sider>

            <Drawer
                open={drawerOpen}
                placement="left"
                onClose={() => setDrawerOpen(false)}
                closeIcon={false}
                width={286}
                rootClassName={styles.mobileDrawer}
                classNames={{
                    content: styles.mobileDrawerContent,
                    body: styles.mobileDrawerBody,
                }}
            >
                <SidebarContent roleLabel={roleLabel} activeKey={activeKey} items={items} />
            </Drawer>

            <Layout className={styles.contentLayout}>
                <header className={styles.mobileHeader}>
                    <Button
                        type="text"
                        icon={drawerOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                        aria-label="Open sidebar menu"
                        onClick={() => setDrawerOpen((value) => !value)}
                    />
                    <Space size={4} className={styles.mobileBrand}>
                        <span className={styles.brandMark} aria-hidden>
                            <Image src="/logo_ms.png" alt="" width={20} height={20} />
                        </span>
                        <span>Med</span>
                        <span className={styles.mobileBrandAccent}>Stream</span>
                    </Space>
                    <Tag>{roleLabel}</Tag>
                </header>
                <Content className={styles.content}>
                    <div className={styles.contentInner}>{children}</div>
                </Content>
            </Layout>
        </Layout>
    );
}
