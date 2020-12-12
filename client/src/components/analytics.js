import '../assets/stylesheets/analytics.scss';
import OccurenceCalendar from './occurenceCalendar'
import SpendingStatistics from './spendingStatistics'
import Charts from './charts'

import React, { Component } from 'react';

export default class Analytics extends Component {
  constructor(props){
    super(props);

    this.state = {
      currentCategory: "all",
    }

    this.handleClick = this.handleClick.bind(this);
  }

  render(){
    return (
      <div className="analytics">
        {this.renderCategorySelector()}
        {this.renderSpendingStatistics()}
        {this.renderOccurenceCalendar()}
        {this.renderCharts()}
      </div>
    )
  }

  renderCategorySelector(){
    let spending = this.sortExpensesByCategory();

    return (
      <div className="card thin">
        {this.renderSpendingHeaders(this.props.expenses.length)}
        {this.renderTableOfSpendingByCategory(spending)}
      </div>
    )
  }

  renderOccurenceCalendar(){
    return <OccurenceCalendar 
      daysThisMonth={this.props.daysThisMonth}
      category={this.state.currentCategory}
      expenses={this.filteredExpenses()} 
    />
  }

  renderSpendingStatistics() {
    return <SpendingStatistics 
      expenses={this.filteredExpenses()}
      category={this.state.currentCategory}
      daysThisMonth={this.props.daysThisMonth}
    />
  }

  renderCharts(){
    return <Charts 
      expenses={this.filteredExpenses()}
      category={this.state.currentCategory}
      daysThisMonth={this.props.daysThisMonth}
      monthlyBudget={this.props.monthlyBudget}
    />
  }

  renderSpendingHeaders(countOfExpenses){
    if(!countOfExpenses){
      return <div>No expenses recorded this month</div>
    }


    return (
      <div className="category-header-row">
        <span className="category-name">Category</span>
        <span className="category-amount">Sum</span>
        <span className="category-percentage">%</span>
      </div>
    )
  }

  renderTableOfSpendingByCategory(spending){
    if(!Object.keys(spending).length){ return }

    let spendingArray = [{
      category: "all",
      amount: this.sumOfAllExpenses(),
    }].concat(
      Object.keys(spending).map((category) => {
        return {
          category: category,
          amount: Number(spending[category]),
        }
      }).sort((a, b) => (a.amount < b.amount) ? 1 : -1)
    );

    return spendingArray.map((category) => {
      return (
        <div className={this.getCategoryRowClass(category.category)}
          key={category.category}
          onClick={() => this.handleClick(category.category)}
        >
          <span className="category-name">{category.category}</span>
          <span className="category-amount">${category.amount}</span>
          <span className="category-percentage">{this.percentageOfMonthlySpending(category.amount)}%</span>
        </div>
      )
    })
  }

  sortExpensesByCategory(){
    let spending = {};
    this.props.expenses.forEach((expense) => {
      const category = expense.category;
      if(typeof(spending[category]) === 'undefined'){
        spending[category] = expense.amount;
      } else {
        spending[category] += expense.amount;  
      }
    });

    return spending;
  }

  handleClick(category){
    this.setState({
      currentCategory: category,
    })
  }

  filteredExpenses(){
    if(this.state.currentCategory === "all"){ return this.props.expenses; }

    return this.props.expenses.filter((expense) => expense.category === this.state.currentCategory);
  }

  percentageOfMonthlySpending(amount){
    return Math.floor(amount/this.sumOfAllExpenses() * 1000)/10
  }

  sumOfAllExpenses(){
    return this.props.expenses.reduce((acc, expense) => {
      return acc + expense.amount;
    }, 0)
  }

  getCategoryRowClass(category){
    return "one-category-row" + (this.state.currentCategory === category ?  " selected" : "");
  }
}
