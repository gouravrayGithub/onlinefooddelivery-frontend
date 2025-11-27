import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

function App() {
  const [view, setView] = useState('home');
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (view === 'orders') {
      loadOrders();
    }
  }, [view]);

  const loadItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      setFoodItems(data);
      if (!selectedItem && data.length > 0) {
        setSelectedItem(data[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch food items', error);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!customerName || !selectedItem) {
      return;
    }
    try {
      await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          itemName: selectedItem,
          quantity: Number(quantity),
        }),
      });
      alert('Order placed!');
      setCustomerName('');
      setQuantity(1);
      loadOrders();
    } catch (error) {
      console.error('Failed to place order', error);
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!newItemName || !newItemPrice) {
      return;
    }
    try {
      await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName,
          price: Number(newItemPrice),
        }),
      });
      setNewItemName('');
      setNewItemPrice('');
      await loadItems();
    } catch (error) {
      console.error('Failed to add food item', error);
    }
  };

  const renderMenuView = () => (
    <section className="card">
      <div className="card-header">
        <h2>Fresh Picks</h2>
        <p>Choose a favorite dish and get it delivered fast.</p>
      </div>
      <ul className="list">
        {foodItems.map((item) => (
          <li key={item.id} className="list-row">
            <span>
              <strong>{item.name}</strong>
            </span>
            <span className="price">${item.price}</span>
          </li>
        ))}
      </ul>

      <div className="divider" />

      <form className="form" onSubmit={handlePlaceOrder}>
        <h3>Place Order</h3>
        <label>
          Customer Name
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </label>
        <label>
          Food Item
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            {foodItems.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <button type="submit" className="primary-btn">
          Place Order
        </button>
      </form>
    </section>
  );

  const renderAddItemView = () => (
    <section className="card">
      <div className="card-header">
        <h2>Add Food Item</h2>
        <p>Keep the menu fresh for customers.</p>
      </div>
      <form className="form" onSubmit={handleAddItem}>
        <label>
          Name
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
          />
        </label>
        <button type="submit" className="primary-btn">
          Add Item
        </button>
      </form>

      <div className="divider" />

      <h3>Current Menu</h3>
      <ul className="list">
        {foodItems.map((item) => (
          <li key={item.id} className="list-row">
            <span>{item.name}</span>
            <span className="price">${item.price}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderOrdersView = () => (
    <section className="card">
      <div className="card-header">
        <h2>Recent Orders</h2>
        <p>Live feed of customer requests.</p>
      </div>
      <ul className="list">
        {orders.map((order) => (
          <li key={order.id} className="list-row">
            <div>
              <strong>{order.customerName}</strong>
              <p className="muted">
                {order.quantity} × {order.itemName}
              </p>
            </div>
          </li>
        ))}
        {orders.length === 0 && (
          <li className="list-row muted">No orders yet.</li>
        )}
      </ul>
    </section>
  );

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Local Food Delivery</p>
          <h1>Delicious meals, right to your door.</h1>
          <p className="muted">
            Manage menu items, take customer orders, and monitor deliveries from
            one simple dashboard.
          </p>
        </div>
        <nav className="nav">
          <button
            className={view === 'home' ? 'active' : ''}
            onClick={() => setView('home')}
          >
            Home
          </button>
          <button
            className={view === 'addItem' ? 'active' : ''}
            onClick={() => setView('addItem')}
          >
            Add Food Item
          </button>
          <button
            className={view === 'orders' ? 'active' : ''}
            onClick={() => setView('orders')}
          >
            Orders
          </button>
        </nav>
      </header>

      <main className="content">
        {view === 'home' && renderMenuView()}
        {view === 'addItem' && renderAddItemView()}
        {view === 'orders' && renderOrdersView()}
      </main>
    </div>
  );
}

export default App;
