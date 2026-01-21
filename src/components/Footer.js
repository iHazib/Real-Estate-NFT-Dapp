const Footer = () => {
    return (
        <footer>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ color: 'var(--color-primary)' }}>Millow</h2>
                <p>&copy; {new Date().getFullYear()} Millow Decentralized Real Estate. All rights reserved.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                    <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
                    <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
