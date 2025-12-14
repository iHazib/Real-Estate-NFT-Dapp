const Search = () => {
    return (
        <header>
            <h2 className="header__title">Find your dream home<br />on the blockchain.</h2>
            <input
                type="text"
                className="header__search"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
            />
        </header>
    );
}

export default Search;