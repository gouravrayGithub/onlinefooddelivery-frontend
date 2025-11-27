import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';
const ROLE = {
  CUSTOMER: 'CUSTOMER',
  MANAGER: 'MANAGER',
};

function App() {
  const [view, setView] = useState('home');
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  const [customerLoginId, setCustomerLoginId] = useState('');
  const [managerLoginId, setManagerLoginId] = useState('');
  const [customerRegisterName, setCustomerRegisterName] = useState('');
  const [managerRegisterName, setManagerRegisterName] = useState('');
  const [customerPortalMessage, setCustomerPortalMessage] = useState('');
  const [managerPortalMessage, setManagerPortalMessage] = useState('');
  const [orderMessage, setOrderMessage] = useState('');

  const isManager = currentUser?.role === ROLE.MANAGER;
  const isCustomer = currentUser?.role === ROLE.CUSTOMER;

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (view === 'orders') {
      loadOrders();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'myOrders' && isCustomer && currentUser?.id) {
      loadUserOrders(currentUser.id);
    }
  }, [view, currentUser, isCustomer]);

  useEffect(() => {
    const allowedViews = new Set(['home']);
    if (isManager) {
      allowedViews.add('addItem');
      allowedViews.add('orders');
    }
    if (isCustomer) {
      allowedViews.add('myOrders');
    }
    if (!allowedViews.has(view)) {
      setView('home');
    }
  }, [view, isManager, isCustomer]);

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

  const loadUserOrders = async (userId) => {
    try {
      setLoadingUserOrders(true);
      const res = await fetch(`${API_BASE}/users/${userId}/orders`);
      const data = await res.json();
      setUserOrders(data);
    } catch (error) {
      console.error('Failed to fetch user orders', error);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const loginUser = async (role, idValue, setMessage, resetInput) => {
    setMessage('');
    if (!idValue) {
      setMessage('Enter a user ID to sign in.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(idValue), role }),
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const user = await res.json();
      setCurrentUser(user);
      setMessage(`Signed in as ${user.name} (ID ${user.id}).`);
      resetInput('');
      if (role === ROLE.CUSTOMER) {
        loadUserOrders(user.id);
      }
    } catch (error) {
      setMessage('Invalid credentials. Check the ID and role.');
    }
  };

  const registerUser = async (role, nameValue, setMessage, resetInput) => {
    setMessage('');
    if (!nameValue.trim()) {
      setMessage('Enter a name to register.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim(), role }),
      });
      if (!res.ok) {
        throw new Error();
      }
      const user = await res.json();
      setMessage(
        `Registered ${role.toLowerCase()} "${user.name}". Save ID ${user.id} for login.`
      );
      resetInput('');
    } catch (error) {
      setMessage('Registration failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserOrders([]);
    setCustomerPortalMessage('');
    setManagerPortalMessage('');
    setOrderMessage('');
    setView('home');
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!isCustomer || !currentUser) {
      setOrderMessage('Sign in as a customer to place orders.');
      return;
    }
    if (!customerName || !selectedItem) {
      setOrderMessage('Fill out your name and pick an item.');
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
          userId: currentUser.id,
        }),
      });
      alert('Order placed!');
      setCustomerName('');
      setQuantity(1);
      setOrderMessage('Order placed! Track it from the My Orders page.');
      loadOrders();
      loadUserOrders(currentUser.id);
    } catch (error) {
      console.error('Failed to place order', error);
      setOrderMessage('Could not place the order. Please try again.');
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!isManager) {
      return;
    }
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

  const handleDeliveryUpdate = async (orderId, delivered) => {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/delivered`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delivered }),
      });
      loadOrders();
      if (isCustomer && currentUser) {
        loadUserOrders(currentUser.id);
      }
    } catch (error) {
      console.error('Failed to update delivery status', error);
    }
  };

  const renderAuthLanding = () => (
    <section className="grid">
      <div className="card">
        <div className="card-header">
          <h2>Customer Login</h2>
          <p>Sign in or register as a customer to start ordering.</p>
        </div>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            loginUser(
              ROLE.CUSTOMER,
              customerLoginId,
              setCustomerPortalMessage,
              setCustomerLoginId
            );
          }}
        >
          <label>
            Existing ID
            <input
              type="number"
              min="1"
              value={customerLoginId}
              onChange={(e) => setCustomerLoginId(e.target.value)}
            />
          </label>
          <button type="submit" className="primary-btn">
            Customer Login
          </button>
        </form>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            registerUser(
              ROLE.CUSTOMER,
              customerRegisterName,
              setCustomerPortalMessage,
              setCustomerRegisterName
            );
          }}
        >
          <label>
            New customer name
            <input
              type="text"
              value={customerRegisterName}
              onChange={(e) => setCustomerRegisterName(e.target.value)}
            />
          </label>
          <button type="submit" className="secondary-btn">
            Register Customer
          </button>
        </form>
        {customerPortalMessage && (
          <p className="info">{customerPortalMessage}</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Manager Login</h2>
          <p>Sign in or register as a manager to manage the kitchen.</p>
        </div>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            loginUser(
              ROLE.MANAGER,
              managerLoginId,
              setManagerPortalMessage,
              setManagerLoginId
            );
          }}
        >
          <label>
            Existing ID
            <input
              type="number"
              min="1"
              value={managerLoginId}
              onChange={(e) => setManagerLoginId(e.target.value)}
            />
          </label>
          <button type="submit" className="primary-btn">
            Manager Login
          </button>
        </form>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            registerUser(
              ROLE.MANAGER,
              managerRegisterName,
              setManagerPortalMessage,
              setManagerRegisterName
            );
          }}
        >
          <label>
            New manager name
            <input
              type="text"
              value={managerRegisterName}
              onChange={(e) => setManagerRegisterName(e.target.value)}
            />
          </label>
          <button type="submit" className="secondary-btn">
            Register Manager
          </button>
        </form>
        {managerPortalMessage && (
          <p className="info">{managerPortalMessage}</p>
        )}
      </div>
    </section>
  );

  const renderMenuView = () => (
    <section className="grid">
      <div className="card stretch">
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
      </div>

      <div className="card stretch">
        <div className="card-header">
          <h2>Place Order</h2>
          <p>Customers can submit a ticket to the kitchen.</p>
        </div>
        <form className="form" onSubmit={handlePlaceOrder}>
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
          <button type="submit" className="primary-btn" disabled={!isCustomer}>
            {isCustomer ? 'Place Order' : 'Customer login required'}
          </button>
        </form>
        {orderMessage && <p className="info">{orderMessage}</p>}
      </div>
    </section>
  );

  const renderAddItemView = () => (
    <section className="card">
      <div className="card-header">
        <h2>Add Food Item</h2>
        <p>Keep the menu fresh for customers.</p>
      </div>
      {isManager ? (
        <>
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
        </>
      ) : (
        <p className="muted">Manager access only.</p>
      )}
    </section>
  );

  const renderOrdersView = () => (
    <section className="card">
      <div className="card-header">
        <h2>Recent Orders</h2>
        <p>Live feed of customer requests.</p>
      </div>
      {isManager ? (
        <ul className="list">
          {orders.map((order) => (
            <li key={order.id} className="list-row order-row">
              <div>
                <strong>{order.customerName}</strong>
                <p className="muted">
                  {order.quantity} × {order.itemName}
                </p>
                <p className="muted">User ID: {order.userId}</p>
              </div>
              <div className="order-actions">
                <span
                  className={`badge ${
                    order.delivered ? 'badge-success' : 'badge-warning'
                  }`}
                >
                  {order.delivered ? 'Delivered' : 'Pending'}
                </span>
                {!order.delivered && (
                  <button
                    className="secondary-btn"
                    onClick={() => handleDeliveryUpdate(order.id, true)}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </li>
          ))}
          {orders.length === 0 && (
            <li className="list-row muted">No orders yet.</li>
          )}
        </ul>
      ) : (
        <p className="muted">Manager access only.</p>
      )}
    </section>
  );

  const renderUserOrdersView = () => (
    <section className="card">
      <div className="card-header">
        <h2>My Orders</h2>
        <p>Customers can see everything they ordered.</p>
      </div>
      {!isCustomer || !currentUser ? (
        <div>
          <p className="muted">
            Log in as a customer to see your delivery status.
          </p>
        </div>
      ) : (
        <div>
          <div className="login-state">
            <p className="muted">Signed in as</p>
            <h3>{currentUser.name}</h3>
            <button className="secondary-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
          {loadingUserOrders ? (
            <p className="muted">Loading orders...</p>
          ) : (
            <ul className="list">
              {userOrders.map((order) => (
                <li key={order.id} className="list-row order-row">
                  <div>
                    <strong>{order.itemName}</strong>
                    <p className="muted">{order.quantity} items</p>
                  </div>
                  <span
                    className={`badge ${
                      order.delivered ? 'badge-success' : 'badge-warning'
                    }`}
                  >
                    {order.delivered ? 'Delivered' : 'On the way'}
                  </span>
                </li>
              ))}
              {userOrders.length === 0 && (
                <li className="list-row muted">No orders yet.</li>
              )}
            </ul>
          )}
        </div>
      )}
    </section>
  );

  const navOptions = [
    { view: 'home', label: 'Home', show: true },
    { view: 'addItem', label: 'Add Food Item', show: isManager },
    { view: 'orders', label: 'Orders', show: isManager },
    { view: 'myOrders', label: 'My Orders', show: isCustomer },
  ];

  return (
    <div className="app">
      <header className="hero">
        <div className="brand-row">
          <div>
            <p className="brand-name">TASTORIA</p>
            <p className="muted">
              Simple food ordering and kitchen management for your restaurant.
            </p>
          </div>
        </div>
        <nav className="nav">
          {navOptions
            .filter((option) => option.show)
            .map((option) => (
              <button
                key={option.view}
                className={view === option.view ? 'active' : ''}
                onClick={() => setView(option.view)}
              >
                {option.label}
              </button>
            ))}
        </nav>
      </header>

      <main className="content">
        {view === 'home' &&
          (currentUser ? renderMenuView() : renderAuthLanding())}
        {view === 'addItem' && renderAddItemView()}
        {view === 'orders' && renderOrdersView()}
        {view === 'myOrders' && renderUserOrdersView()}
      </main>
    </div>
  );
}

export default App;

