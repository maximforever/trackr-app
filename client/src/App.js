import React, { Component } from 'react';
import './assets/stylesheets/App.scss';


import SignInPage from './components/signInPage'
import ExpenseForm from './components/expenseForm'
import ExpenseList from './components/expenseList'
import Dashboard from './components/dashboard'
import Navigation from './components/navigation'
import Settings from './components/settings'
import Stats from './components/stats'
import UserHeader from './components/userHeader'

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      status: "loading",
      user: null,
      expenses: [],
      categories: [],
      monthlyBudget: 0,
      currentDate: {
        month: null,
        year: null,
      },
      showExpenseForm: false,
      currentMonthlyBudget: 0,
      currentPage: "home",
      datepickerPages: ["home", "stats"],
    }

    this.fetchExpenses = this.fetchExpenses.bind(this);
    this.fetchUserSettings = this.fetchUserSettings.bind(this);
    this.submitNewExpense = this.submitNewExpense.bind(this);
    this.deleteExpense = this.deleteExpense.bind(this);
    this.navigateToPage = this.navigateToPage.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.toggleExpenseForm = this.toggleExpenseForm.bind(this);
    this.previousMonth = this.previousMonth.bind(this);
    this.nextMonth = this.nextMonth.bind(this);
  }

  componentDidMount(){
    this.setCurrentDate();
    this.fetchSession();
  }

  render() {
    return(
      <div className="App">
        {this.renderContent()}
      </div>
    )
  }

  renderContent() {
    switch (this.state.status){
      case "loggedIn":
        return this.renderLoggedInInterface();
      case "loggedOut":
        return <SignInPage />
      default:
        return null;
    }
  }

  renderLoggedInInterface() {
    return(
      <div>
        <UserHeader user={this.state.user} />          
        {this.renderNavigation()}
        {this.renderLoggedInBodyContent()}
      </div>
    )
  }

  renderLoggedInBodyContent() {
    if(this.state.currentPage === "home"){
      return this.renderHome();
    } else if (this.state.currentPage === "stats"){
      return this.renderStats();
    } else if (this.state.currentPage === "settings"){
      return this.renderSettings();
    }
  }

  renderHome(){
    return (
      <div className="home">
        {this.renderDashboard()}
        <ExpenseForm 
          submitNewExpense={this.submitNewExpense}
          toggleExpenseForm={this.toggleExpenseForm}
          categories={this.state.categories}
        />
        {this.renderExpenseList()}
      </div>
    );
  }

  renderNavigation(){
    if(this.state.showExpenseForm){ return null; }

    return(
      <Navigation 
        navigateToPage={this.navigateToPage} 
        renderDateSelector={this.pageShouldIncludeDatepicker()}
        date={this.state.currentDate}
        nextMonth={this.nextMonth}
        previousMonth={this.previousMonth}
      />
    )
  }

  renderDashboard(){
    if(this.state.showExpenseForm){ return null; }

    return(
      <Dashboard
        expenses={this.state.expenses}
        monthlyBudget={this.getCurrentBudget()}
        currentDate={this.state.currentDate}
      />
    )
  }

  renderExpenseList(){
    return(
      <ExpenseList 
        expenses={this.state.expenses} 
        deleteExpense={this.deleteExpense}
        editExpense={this.editExpense}
      />
    )
  }

  renderStats(){
    return <Stats 
      expenses={this.state.expenses}
      categories={this.state.categories}
      monthlyBudget={this.getCurrentBudget()}
    />
  }

  renderSettings(){
    return (
      <Settings 
        monthlyBudget={this.state.monthlyBudget}
        currentMonthlyBudget={this.state.currentMonthlyBudget}
        preferredFirstName={this.state.user.firstName}
        updateSettings={this.updateSettings}
        key={this.state.monthlyBudget + this.state.currentMonthlyBudget}
      />
    )
  }

  getCurrentBudget(){
    if(this.state.currentMonthlyBudget === this.state.monthlyBudget){
      return this.state.monthlyBudget;
    }
    
    return this.state.currentMonthlyBudget;
  }
  
  submitNewExpense(expense, successCallback){
    fetch('/api/v1/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    })
      .then(res => res.json())
      .then((response) => { 
        if(response.status === 200){
          let updatedCategories = this.state.categories;
          let updatedExpenses = this.state.expenses.concat({...response.newExpense, new: true})

          if(!updatedCategories.includes(expense.category)){
            updatedCategories = updatedCategories.concat(expense.category)
          }

          this.setState({
            expenses: updatedExpenses,
            categories: updatedCategories,
          })

          this.toggleExpenseForm();
          successCallback(true);
        } else {
          console.log(response.message);
        }
      })
      .catch((error) => { console.log("Error fetching data", error); })
  }

  deleteExpense(e, id){
    e.stopPropagation();
    fetch(`/api/v1/expenses/${id}${this.dateParams()}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then((response) => { 
        this.setState({
          expenses: response.expenses,
          categories: response.categories,
        })
      })
      .catch((error) => { console.log("Error fetching data", error); })
  } 

  editExpense(id){
    console.log(id);
    
  } 

  fetchSession() {
    fetch('/session', this.fetchOptions())
      .then(res => res.json())
      .then((response) => { 
        this.setState({
          status: response.status,
          user: response.loggedInUser
        }, () => {
          if(this.state.status === "loggedIn"){
            // TODO this is uglyyyy

            this.fetchExpenses();
            this.fetchUserSettings();
          }
        })
      })
      .catch((error) => { console.log("Error fetching session data", error); })
  }

  fetchExpenses() {
    fetch(`/api/v1/expenses/${this.dateParams()}`)
      .then(res => res.json())
      .then((response) => { 
        this.setState({
          expenses: response.expenses,
          categories: response.categories,
        })
      })
      .catch((error) => { console.log("Error fetching data", error); })
  }

  fetchUserSettings() {
    fetch('/api/v1/users/settings')
      .then(res => res.json())
      .then((response) => { 
        let user = {...this.state.user}
        user.firstName = response.preferredFirstName

        this.setState({
          monthlyBudget: response.monthlyBudget,
          currentMonthlyBudget: response.currentMonthlyBudget,
          user,
        })
      })
      .catch((error) => { console.log("Error fetching data", error); })
  }

  setCurrentDate(){
    const d = new Date();

    let currentDate = {
      month: d.getMonth() + 1,
      year: 1900 + d.getYear(),
    }

    if(currentDate.month.length === 1){ currentDate.month = `0${currentDate.month}` }
    this.setState({
      currentDate
    },  )
  }

  updateSettings(newSettings) {
    fetch('/api/v1/users/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSettings),
    })
      .then(res => res.json())
      .then((response) => {
        let user = {...this.state.user}
        user.firstName = response.preferredFirstName

        this.setState({
          monthlyBudget: response.monthlyBudget,
          currentMonthlyBudget: response.currentMonthlyBudget,
          currentPage: "home",
          user,
        })
      })
      .catch((error) => { console.log("Error fetching data", error); })
  }

  navigateToPage(page){
    this.setState({
      currentPage: page
    })
  }

  pageShouldIncludeDatepicker(){
    return this.state.datepickerPages.includes(this.state.currentPage);
  }

  fetchOptions(){
    //const token = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    return {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'someTestValue',
      }
    }
  }

  toggleExpenseForm(){
    this.setState((prevState) => {
      return {
        showExpenseForm: !prevState.showExpenseForm,
      }
    })
  }

  dateParams(){
    return `?month=${this.state.currentDate.month}&year=${this.state.currentDate.year}`;
  }

  nextMonth(){
    // JS months run 0 to 11
    let newMonth = this.state.currentDate.month < 12 ? this.state.currentDate.month + 1 : 1;
    let newYear = newMonth === 1 ? this.state.currentDate.year + 1 : this.state.currentDate.year;
    const currentDate = {
      month: newMonth,
      year: newYear,
    }

    this.setState({currentDate}, () => this.fetchExpenses());
  }

  previousMonth(){
    // JS months run 0 to 11
    let newMonth = this.state.currentDate.month > 1 ? this.state.currentDate.month - 1 : 12;
    let newYear = newMonth === 12 ? this.state.currentDate.year - 1 : this.state.currentDate.year;
    const currentDate = {
      month: newMonth,
      year: newYear,
    }

    this.setState({currentDate}, () => this.fetchExpenses());
  }
}

export default App;